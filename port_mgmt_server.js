const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3001;

// app.use(express.json()); // 使用 Express 解析 JSON
// 設定請求內容解析
app.use(express.json({ limit: '25mb' })); // 允許圖片上傳所需的 JSON 大小
app.use(express.urlencoded({ extended: true, limit: '25mb' })); // 解析 urlencoded 表單資料

app.use(express.static(path.join(__dirname))); // 將目前目錄設為靜態檔案目錄

const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const SERVICE_NAME = process.env.SERVICE_NAME || 'port-mgmt';
const SERVICE_MANAGER_EVENTS_URL = process.env.SERVICE_MANAGER_EVENTS_URL || 'http://localhost:3010/api/service-events';

const clients = new Set();
const messageHistory = [];
const MAX_MESSAGE_HISTORY = 100;

app.get('/messages', (req, res) => {
  res.json(messageHistory);
});

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

async function postServiceEvent(message) {
  try {
    await fetch(SERVICE_MANAGER_EVENTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: SERVICE_NAME,
        type: message.type,
        time: message.time,
        payload: message.payload
      })
    });
  } catch (error) {
    console.error('Failed to send service event:', error.message);
  }
}

function formatMessageTime(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function broadcastMessage(type, payload) {
  const message = {
    time: formatMessageTime(),
    type,
    payload
  };

  messageHistory.unshift(message);
  if (messageHistory.length > MAX_MESSAGE_HISTORY) {
    messageHistory.pop();
  }

  postServiceEvent(message);

  for (const client of clients) {
    client.write(`data: ${JSON.stringify(message)}\n\n`);
  }
}

function broadcastDataChange(action, payload) {
  broadcastMessage(action, payload);
}

function getSimpleImageUrl(imageValue) {
  if (typeof imageValue !== 'string') {
    return 'unknown-image';
  }

  if (imageValue.startsWith('data:image/')) {
    return 'embedded-image';
  }

  try {
    const url = new URL(imageValue, `http://localhost:${port}`);
    return `${url.pathname}${url.search}`.replace(/^\//, '');
  } catch (error) {
    return imageValue;
  }
}

function simplifyQuillDelta(delta) {
  if (!delta || !Array.isArray(delta.ops)) {
    return delta;
  }

  return delta.ops.map(op => {
    const insert = op?.insert;

    if (typeof insert === 'string') {
      return insert;
    }

    if (insert?.image) {
      return `[image: ${getSimpleImageUrl(insert.image)}]`;
    }

    return '';
  }).join('');
}

function simplifyRowForMessage(row) {
  if (!row || typeof row !== 'object') {
    return row;
  }

  return {
    ...row,
    remark: simplifyQuillDelta(row.remark)
  };
}

function simplifyRowsForMessage(rows) {
  return (Array.isArray(rows) ? rows : [rows]).map(simplifyRowForMessage);
}

app.post('/uploadImage', async (req, res) => {
  const match = /^data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=\s]+)$/i.exec(req.body?.dataUrl || '');
  if (!match) {
    return res.status(400).json({ success: false, message: 'Invalid image data.' });
  }

  const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const imageBuffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
    return res.status(413).json({ success: false, message: 'Image must be smaller than 15 MB.' });
  }

  try {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    await fs.promises.writeFile(path.join(UPLOAD_DIR, fileName), imageBuffer);
    res.json({ success: true, url: `uploads/${fileName}` });
  } catch (error) {
    console.error('Error saving image:', error);
    res.status(500).json({ success: false, message: 'Failed to save image.' });
  }
});

app.post('/saveData', (req, res) => {
  const payload = req.body;  // 可以是單一物件或陣列
  console.log('incoming payload:', payload);

  const newEntry = Array.isArray(payload) ? payload : [payload];
  
  // fs.readFile('data.json', 'utf8', (err, data) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Error reading file:', err);
      // 若不是檔案不存在錯誤，回傳讀取失敗
      res.status(500).send('Failed to read existing data');
      return;
    }
    let jsonData = [];  
    if (data) {
      try {
        jsonData = JSON.parse(data); 
        // 若既有資料不是陣列，先轉成陣列
        if (!Array.isArray(jsonData)) {
        jsonData = [jsonData];
        }
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
        res.status(500).send('Error parsing JSON data');
        return;
      }
    }
    newEntry.forEach(item => {
      const existingIndex = jsonData.findIndex(entry => entry.uuid === item.uuid);
      if (existingIndex !== -1) {        
        jsonData[existingIndex] = item; // 已存在時直接覆蓋該筆資料
      } else {
        jsonData.push(item); // 不存在時新增資料
      }
    });
    // fs.writeFile('data.json', JSON.stringify(jsonData, null, 2), 'utf8', writeErr => {
    fs.writeFile(DATA_FILE, JSON.stringify(jsonData, null, 2), 'utf8', writeErr => {
      if (writeErr) {
        console.error('Error writing JSON:', writeErr);
        res.status(500).send('Failed to update data');
        return;
      }
      broadcastDataChange('saveData', { rows: simplifyRowsForMessage(newEntry) });
      res.json({ message: 'Data updated successfully!', data: newEntry });
    });
  });
});

// =====================
// 刪除資料：/deleteRow
// =====================
app.post('/deleteRow', (req, res) => {
  const { uuid } = req.body;

  if (!uuid) {
    return res.status(400).json({ success: false, message: '缺少 uuid' });
  }

  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    // 若資料檔不存在，視為沒有資料需要刪除
    if (err && err.code === 'ENOENT') {
      console.warn('DATA_FILE not found, nothing to delete');
      return res.json({ success: true, deleted: false, message: 'no data file, nothing deleted' });
    }

    if (err) {
      console.error('Error reading data.json:', err);
      return res.status(500).json({ success: false, message: 'Failed to read data' });
    }

    let rows = [];
    try {
      rows = JSON.parse(data);
      if (!Array.isArray(rows)) {
        rows = [rows];
      }
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      return res.status(500).json({ success: false, message: '資料格式解析失敗' });
    }

    const originalLength = rows.length;
    const deletedRows = rows.filter(row => row.uuid === uuid);
    const newRows = rows.filter(row => row.uuid !== uuid);
    const deleted = newRows.length !== originalLength;

    fs.writeFile(DATA_FILE, JSON.stringify(newRows, null, 2), 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing JSON:', writeErr);
        return res.status(500).json({ success: false, message: '寫入資料失敗' });
      }

      broadcastDataChange('deleteRow', {
        uuid,
        deleted,
        rows: simplifyRowsForMessage(deletedRows)
      });

      res.json({
        success: true,
        deleted,
        message: deleted ? '刪除成功' : '找不到指定 uuid 的資料'
      });
    });
  });
});


app.get('/data', (req, res) => {
  // fs.readFile(path.join(__dirname, 'data.json'), 'utf8', (err, data) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data.json:', err);
      res.status(500).send('Error reading data');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    }
  });
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/port_mgmt.html');
});
  
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


