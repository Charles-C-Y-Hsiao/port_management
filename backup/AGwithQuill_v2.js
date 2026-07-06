  // 初始化Quill編輯器
  var quill = new Quill('#editor', {
    modules: {
        toolbar: '#toolbar'
    },
    theme: 'bubble',
    // Initialize as read-only
    readOnly: true,
  });

  // 添加字體大小的選項
  var Size = Quill.import('attributors/style/size');
  Size.whitelist = ['16px', '18px', '20px', '24px'];
  Quill.register(Size, true);

  // 定義 Quill Delta 格式資料
  const quillData = {
    "ops":[{"attributes":{"italic":true,"color":"#e60000","bold":true},"insert":"TTT"},
    {"attributes":{"list":"ordered"},"insert":"\n"},{"attributes":{"italic":true,"color":"#008a00","background":"#ffff00","bold":true},"insert":"DDD"},
    {"attributes":{"indent":2,"list":"ordered"},"insert":"\n"},{"attributes":{"strike":true},"insert":"WWW"},{"insert":"\n"}]
  };

  // const quillData =  { "ops": [{ insert: "\n" }] };

  // 設定預設內容
  quill.setContents(quillData);

  // 使用 Quill 將 Delta 轉換為 HTML
  const quillCellRenderer = (params) => {
    const container = document.createElement('div');
    const quillDiv = document.createElement('div');
    container.appendChild(quillDiv);
    // 初始化 Quill 的空白編輯器
    const tempQuill = new Quill(quillDiv, {
      theme: 'bubble',
      // readOnly: true
    });
    // 使用 Delta 設定內容
    tempQuill.setContents(params.value); // Quill 會根據傳入的Delta（JSON 格式的內容及格式資訊）自動生成對應的 HTML
    // console.log(JSON.stringify(params.value))
    container.innerHTML = tempQuill.root.innerHTML;  // Quill 生成的HTML再被設定到容器的 innerHTML 上
    // console.log(tempQuill.root.innerHTML)
    container.classList.add('ql-editor','ql-editor-modify');
    // 返回容器元素
    return container;
  };

// 定義 valueFormatter 將物件轉為字串 (為了滿足 AG Grid 的需求)
const remarkValueFormatter = (params) => {
  if (params.value && typeof params.value === 'object') {
    return JSON.stringify(params.value); // 將 Delta 格式轉成字串
  }
  return params.value;
};

// // 定義 valueParser，將輸入值解析成物件（Delta格式）
// // 用於將編輯器回傳的值轉換為適合儲存的格式（這裡是 Quill Delta 物件），如果沒有提供，ag‑Grid 就無法處理物件型態的值
// const remarkValueParser = (params) => {
//   // 如果 newValue 已經是物件，就直接回傳
//   if (params.newValue && typeof params.newValue === 'object') {
//     return params.newValue;
//   }
//   // 嘗試解析字串（如果可能）
//   try {
//     return JSON.parse(params.newValue);
//   } catch (e) {
//     return params.newValue;
//   }
// };

const remarkValueParser = (params) => {
  // 透過 deep copy 產生一個新的物件
  // JSON.stringify：將該物件轉換為 JSON 字串。
  // JSON.parse：再把這個 JSON 字串解析回一個新的物件。
  // 好處是可以確保返回的物件與原本的物件不是同一個引用，從而讓 AG Grid 能正確辨識到資料已經發生改變，
  // 進而觸發更新事件（例如 onRowValueChanged）。此外，深拷貝也可以防止後續對原始物件的修改影響到已儲存的資料。
  return JSON.parse(JSON.stringify(params.newValue));
};

let gridApi;

const columnDefs = [
  { field: "uuid",
    hide: true,
  },
  { field: "make",
    editable: true,
  },
  { field: "Model",
    editable: true,
  },
  { field: "price",
    editable: true,
  },
  { field: "electric",
    editable: true,
    // cellRenderer: MissionResultRenderer,
    cellEditor: 'agCheckboxCellEditor',
    cellRenderer: 'agCheckboxCellRenderer'
  },
  { 
    headerName: "RMK",
    field: "remark",
    cellRenderer: quillCellRenderer, // 使用自訂的 Quill cellRenderer
    valueFormatter: remarkValueFormatter, // 使用 valueFormatter 來轉換物件為字串
    valueParser: remarkValueParser, // 添加 valueParser 來解析物件數據
    cellEditor: QuillCellEditor, // 編輯模式下，啟用 Quill
    editable: true,
  },
];

const gridOptions = {
  columnDefs: columnDefs,
  rowData: [],
  // onCellValueChanged: CellValueChanged,
  defaultColDef: {
    flex: 1,
    filter: true,
    // floatingFilter: true,
    autoHeight: true,
    // cellStyle: { display: 'flex', alignItems: 'center'},
    cellClass: "ag-center-cell",
    // enableCellChangeFlash: true,
  },
  autoSizeStrategy: {
    type: "fitCellContents",
  },
};

let isEditing = false;
let storedRows = [];
let previousRowUuid = null;
let previousRowIndex = null;

gridOptions.onCellEditingStarted = function(event) {
  isEditing = true; // 不論是 remark 或非 remark 欄位，都表示正在編輯
  // console.log("開始編輯欄位:", event.colDef.field);
  scheduleUpdate();
  // const editingCells = gridApi.getEditingCells();
  // console.log("開始編輯，正在編輯的儲存格：", editingCells);
};

gridOptions.onCellEditingStopped = function(event) {
  // console.log("結束編輯欄位:", event.colDef.field);
  // 用事件資料更新 storedRows（如果需要的話，可以跟 remark 的邏輯一樣）
  const currentUuid = event.data.uuid;
  const currentRowIndex = event.rowIndex;
  const field = event.colDef.field;
  const newValue = event.newValue;
  console.log('event(EditingStopped):', event);

  const rowIndex = storedRows.findIndex(row => row.uuid === currentUuid);
  if (rowIndex === -1) {
    storedRows.push({ ...event.data });
    // console.log('首次儲存(EditingStopped):', event.data);
  } else {
    storedRows[rowIndex][field] = newValue; //field = event.colDef.field & newValue = event.newValue;
    // console.log('更新後的資料(EditingStopped):', storedRows[rowIndex]);
  }
  console.log('更新後的storedRows:', storedRows);
  previousRowUuid = currentUuid;
  previousRowIndex = currentRowIndex;

  // 結束編輯後，標記 isEditing 為 false 並重新啟動計時器
  isEditing = false;
  scheduleUpdate();
};

let debounceTimeout;

function scheduleUpdate() {
  // 如果先前已有計時器，先清除它
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  // 設定一個新的計時器，假設延遲3秒後執行更新
  debounceTimeout = setTimeout(() => {
    // 如果仍在編輯中，則重新啟動計時器
    if (isEditing) {
      // console.log("持續編輯中，重新計時...");
      scheduleUpdate();
    } else {
      // console.log("編輯結束，呼叫 updateBackend");
      updateBackend(storedRows);
    }
  }, 3000);
}

function fetchAndRenderData() {
  fetch('/data')
  .then(response => response.json())
  .then(dataArray => {
    console.log('dataArray: ',dataArray);
    gridApi.setGridOption('rowData', dataArray) // 更新 AG Grid 的資料
  })
  .catch(error => console.error('Error fetching data:', error));
}

// 模擬的更新後端資料函式
function updateBackend(updatedRow) {
  // console.log('儲存更新資料到後端:', updatedRow);
  fetch('/saveData', 
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedRow)
    })
    .then(response => response.json())
    .then(savedData => {       
      alert(savedData.message);  
      storedRows = [];
      // console.log('after saved, storedRows:', storedRows);    
      fetchAndRenderData(); // 成功後重新取得並渲染資料
    })
    .catch(error => console.error('Error:', error));
}

function createNewRowData() { 
  const newData = { uuid: (crypto.randomUUID && crypto.randomUUID()) || ('uuid-' + Math.random().toString(36).substr(2, 9)),
    make: "",
    model: "",
    price: null,
    electric: false,
    remark: { ops: [{ insert: "\n" }] } // 空的 Quill Delta
  };
  return newData;
}

function addItems() {
  // 使用 gridApi 的 applyTransaction 方法將新 row 加入到 grid 中
  gridApi.applyTransaction({ add: [createNewRowData()] });
}
// 輔助函式：將 CSS 色碼 (例如 "#e60000") 轉成 ExcelJS ARGB 格式 (例如 "FFE60000")
function cssColorToARGB(cssColor) {
  if (cssColor[0] === '#') {
    return 'FF' + cssColor.substring(1).toUpperCase();
  }
  return cssColor;
}

  /**
   * 將 Quill Delta 轉換為 ExcelJS Rich Text 陣列格式
   * 規則：
   * 1. 每個文字段預設字型為 Calibri
   * 2. 若 op.attributes 有 bold、italic、underline、strike、color 等則依此設定到 font 中
   * 3. 檢查後續 op：若下一個 op 為換行符且附有 list 屬性 (例如 bullet 或 ordered)
   *    則將列表符號 ("• " 或 "1. " 等) 加到前一段文字的開頭，並跳過該換行 op
   * 4. 若 op.insert 為純換行（"\n"）則直接略過
   */
  function convertDeltaToRichText(delta) {
    const ops = delta.ops || [];
    const richTextArray = [];
    let i = 0;

    while (i < ops.length) {
      const op = ops[i];
      // 若 op.insert 為字串
      if (typeof op.insert === 'string') {
        
        // 取出文字內容與預設字型設定
        let text = op.insert;
        let font = { name: 'Calibri' };
        let hasAttributes = false;
        // console.log(JSON.stringify(text),"i: ",i); // 可以檢查每個進來的元素

        if (op.attributes) {
          hasAttributes = true;
          if (op.attributes.bold) font.bold = true;
          if (op.attributes.italic) font.italic = true;
          if (op.attributes.underline) font.underline = true;
          if (op.attributes.strike) font.strike = true;
          if (op.attributes.color) {
            font.color = { argb: cssColorToARGB(op.attributes.color) };
          }
        }
        if (op && op.insert === "\n" && op.attributes && op.attributes.list) {
          if (op.attributes.list === 'bullet') {
            // console.log('richTextArray.length: ',richTextArray.length)
            let j = richTextArray.length -1;
            while (j >= 0) {
              // console.log('j: ',j)
              if (richTextArray[j].hasAttributes === false) {
                const currentText = richTextArray[j].text;
                if (currentText === "\n") {
                  // 如果該元素的 text 完全等於 "\n"
                  // console.log("currentText === n")
                  const prevText = richTextArray[j + 1].text;
                  richTextArray[j + 1].text = '• ' + prevText;
                } 
                else if (currentText.includes("\n")) {
                  // 如果該元素的 text 中包含 "\n"
                  // 使用正規表達式拆分開頭的換行符和其後的文字
                  const match = currentText.match(/^(\n+)(.*)/);
                  if (match) {
                    // 在換行符後面插入 bullet 前綴
                    richTextArray[j].text = match[1] + '• ' + match[2];
                  } else {
                    // 若沒有匹配到則直接在前面加上 bullet（備援）
                    richTextArray[j].text = '• ' + currentText;
                  }
                } 
                else {
                  // 其他情況，直接在文字前加上 bullet
                  richTextArray[j].text = '• ' + currentText;
                }
                break; // 找到後退出迴圈
              }
              j--;
            }
          } 
          else if (op.attributes.list === 'ordered') {
            // console.log('richTextArray.length: ',richTextArray.length)
            let j = richTextArray.length -1;
            while (j >= 0) {
              // console.log('j: ',j)
              if (richTextArray[j].hasAttributes === false) {
                const currentText = richTextArray[j].text;
                if (currentText === "\n") {
                  // 如果該元素的 text 完全等於 "\n"
                  // console.log("currentText === n")
                  const prevText = richTextArray[j + 1].text;
                  richTextArray[j + 1].text = '• ' + prevText;
                } 
                else if (currentText.includes("\n")) {
                  // 如果該元素的 text 中包含 "\n"
                  // 使用正規表達式拆分開頭的換行符和其後的文字
                  const match = currentText.match(/^(\n+)(.*)/);
                  if (match) {
                    richTextArray[j].text = match[1] + '• ' + match[2];
                  } else {
                    richTextArray[j].text = '• ' + currentText;
                  }
                } 
                else {
                  richTextArray[j].text = '• ' + currentText;
                }
                break; // 找到後退出迴圈
              }
              j--;
            }
          }
        } 
        i++;
        // 將此段文字及格式加入 richText 陣列
        richTextArray.push({ text, font, hasAttributes });      
      } else {
        // 若 op.insert 不是字串 (例如圖片等)，可依需求處理，這裡直接跳過
        richTextArray.push({ text, font, hasAttributes }); 
        i++;
      }

    }
    richTextArray.forEach((item, index) => {
      // console.log(`元素 ${index}:`, item);
    });    
    if (richTextArray.length > 0 && richTextArray[richTextArray.length - 1].text === "\n") {
      richTextArray.pop();
    }
    return richTextArray.map(item => ({ text: item.text, font: item.font })); // 回傳時移除掉輔助的 hasAttributes 屬性
  }

const make_list =
[
  {
    "make": "QWE",
    // "Price MB": "QWE MB",
    "Price MB": 123,
    "Price Chall.": "QWE Chall.",
    // "electric": false,
    // "Model": "TO"
  },
  {
    "make": "AVG",
    // "Price MB": "AVG MB",
    "Price MB": 456,
    "Price Chall.": "AVG Chall.",
    // "electric": false,
    // "Model": "QQ",
  },
  {
    "make": "EEE",
    // "Price MB": "EEE MB",
    "Price MB": 789,
    "Price Chall.": "EEE Chall.",
    // "electric": true,
    // "Model": "YA",
  },
  {
    "make": "FFF",
    // "Price MB": "FFF MB",
    "Price MB": 101,
    "Price Chall.": "FFF Chall.",
    // "electric": true,
    // "Model": "YO"
  }
];

  async function onBtnExportExcel() {
    const rowData = [];
    gridApi.forEachNode(function (node) {
      rowData.push(node.data);
    });
    if (rowData.length === 0) {
      alert('目前沒有資料可供匯出！');
      return;
    }
  
    // 建立 ExcelJS Workbook 與 Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
  
    worksheet.columns = [
      { header: 'Make', key: 'make', width: 20 },
      { header: 'Model', key: 'model', width: 20 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Price', key: 'priceCopy', width: 10 },
      { header: 'Electric', key: 'electric', width: 10 },
      { header: 'Remark', key: 'remark', width: 40 },
    ];
  
    // 對每一筆原始資料建立兩筆資料（row1 與 row2）
    rowData.slice(0, 20).forEach(originalRow => {
      // 第一筆：複製並修改 remark 與新增 priceCopy
      const row1Data = { ...originalRow };
      row1Data.remark = convertDeltaToRichText({ ops: [{ insert: "我是第一筆row資料" }] });
      row1Data.priceCopy = row1Data.price;

      // 使用 make 值在 make_list 中尋找對應的項目
      const matchedItem = make_list.find(item => item.make === row1Data.make);
      if (matchedItem) {
        // 更新 row1Data 的 price 與 priceCopy
        row1Data.price = matchedItem["Price MB"];
        // row1Data.priceCopy = matchedItem["Price Chall."];
      }
      
      // 第二筆：保持原始 remark (若為物件則轉換)，並同樣新增 priceCopy
      const row2Data = { ...originalRow };
      if (row2Data.remark && typeof row2Data.remark === 'object') {
        row2Data.remark = convertDeltaToRichText(row2Data.remark);
      }
      row2Data.priceCopy = row2Data.price;
  
      // 新增 row1 與 row2 到 worksheet
      const newRow1 = worksheet.addRow({
        make: row1Data.make != null ? String(row1Data.make) : '',
        model: row1Data.model != null ? String(row1Data.model) : '',
        price: typeof row1Data.price === 'number' ? row1Data.price : Number(row1Data.price),
        priceCopy: typeof row1Data.priceCopy === 'number' ? row1Data.priceCopy : Number(row1Data.priceCopy),
        electric: row1Data.electric,
        remark: row1Data.remark ? { richText: row1Data.remark } : ''
      });
      const newRow2 = worksheet.addRow({
        make: row2Data.make != null ? String(row2Data.make) : '',
        model: row2Data.model != null ? String(row2Data.model) : '',
        price: typeof row2Data.price === 'number' ? row2Data.price : Number(row2Data.price),
        priceCopy: typeof row2Data.priceCopy === 'number' ? row2Data.priceCopy : Number(row2Data.priceCopy),
        electric: row2Data.electric,
        remark: row2Data.remark ? { richText: row2Data.remark } : ''
      });  
      // 水平合併每一列的第三與第四欄（Price 與 PriceCopy）
      const priceColNumber = worksheet.getColumn('price').number;        // 取得 'price' 欄的數字索引
      const priceCopyColNumber = worksheet.getColumn('priceCopy').number;  // 取得 'priceCopy' 欄的數字索引
      worksheet.mergeCells(newRow1.number, priceColNumber, newRow1.number, priceCopyColNumber);
      worksheet.mergeCells(newRow2.number, priceColNumber, newRow2.number, priceCopyColNumber);
      
      // 垂直合併這一對資料的 Electric 欄位（假設 Electric 為第 5 欄）
      const electricColNumber = worksheet.getColumn('electric').number;
      worksheet.mergeCells(newRow1.number, electricColNumber, newRow2.number, electricColNumber);

      // 取得 price 欄位：因為在 worksheet.columns 陣列中是第 3 個欄位
      const priceColumn = worksheet.getColumn('price');
      console.log('Price column header:', priceColumn.header);
      worksheet.getColumn('price').header = 'Price MB';
      // 取得 priceCopy 欄位：在 worksheet.columns 陣列中是第 4 個欄位
      worksheet.getColumn('priceCopy').header = 'Price chall';

    });

    const remarkColNumber = worksheet.getColumn('remark').number;
    // 設定所有儲存格的字型與對齊方式
    worksheet.eachRow((row) => {
      row.eachCell((cell, colNumber) => {
        if (!cell.font) {
          cell.font = { name: 'Calibri' };
        }
        // 如果目前儲存格的欄位數等於 remark 欄位的數字索引，且有值，就設定垂直置中與自動換行
        if (colNumber === remarkColNumber  && cell.value) {
          cell.alignment = { vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });
  
    // 產生檔案並觸發下載
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported_data.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }
  

  function ShowExcel() {
    const rowData = [];
    gridApi.forEachNode(function (node) {
      rowData.push(node.data);
      console.log(node.data)
    });
    if (rowData.length === 0) {
      alert('目前沒有資料可供匯出！');
      return;
    }
  }

// 當網頁內容載入完後，初始化 ag-Grid
document.addEventListener('DOMContentLoaded', function() {
  const myGridElement = document.querySelector('#myGrid');
  gridApi = agGrid.createGrid(myGridElement, gridOptions);
  
  // let rowData = [
  //   {make: "Tesla", model: "Model Y", price: 64950, electric: true, remark: quillData},
  //   {make: "Ford", model: "F-Series", price: 33850, electric: true, remark: quillData},
  //   {make: "Toyota", model: "Corolla", price: 29600, electric: true, remark: quillData},
  // ];

  // // 在將 rowData 丟進 gridOptions 之前，先為每筆資料加上 uuid 屬性
  // rowData   = rowData.map(item => {
  //   // 使用 crypto.randomUUID() 產生 UUID，如果不支援則用 fallback
  //   const uuid = (crypto.randomUUID && crypto.randomUUID()) || ('uuid-' + Math.random().toString(36).substr(2, 9));
  //   // 使用展開運算子建立新物件，確保 uuid 屬性排在第一個
  //   return { uuid, ...item };
  // });

  // // 將更新後的資料印出來確認
  // console.log(rowData);
  fetchAndRenderData();


  // // 使用 fetch 發送 POST 請求
  // fetch('/saveData', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({ rowData: rowData })
  // })
  // .then(response => {
  //   if (!response.ok) {
  //     throw new Error('Network response was not ok: ' + response.statusText);
  //   }
  //   return response.text();
  // })
  // .then(result => {
  //   console.log('Server response:', result);
  // })
  // .catch(error => {
  //   console.error('Error:', error);
  // });

  // // 更新 ag-Grid 的 rowData
  // gridApi.setGridOption('rowData', rowData);
});


