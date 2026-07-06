  const serviceMessages = [];
  const maxRenderedMessages = 100;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatMessageTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString();
  }

  function formatMessagePayload(payload) {
    try {
      return JSON.stringify(payload, null, 2);
    } catch (error) {
      return String(payload);
    }
  }

  function renderServiceMessages() {
    const messageList = document.getElementById('messageList');
    const messageCount = document.getElementById('messageCount');
    if (!messageList || !messageCount) return;

    messageCount.textContent = `${serviceMessages.length} message${serviceMessages.length === 1 ? '' : 's'}`;

    if (serviceMessages.length === 0) {
      messageList.innerHTML = '<div class="message-empty">No messages yet.</div>';
      return;
    }

    messageList.innerHTML = serviceMessages.map((message) => `
      <article class="message-item">
        <div class="message-meta">
          <span class="message-type">${escapeHtml(message.type || 'message')}</span>
          <time>${escapeHtml(formatMessageTime(message.time))}</time>
        </div>
        <pre>${escapeHtml(formatMessagePayload(message.payload))}</pre>
      </article>
    `).join('');
  }

  function addServiceMessage(message) {
    serviceMessages.unshift(message);
    if (serviceMessages.length > maxRenderedMessages) {
      serviceMessages.pop();
    }
    renderServiceMessages();
  }

  async function loadMessageHistory() {
    try {
      const response = await fetch('messages');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const messages = await response.json();
      serviceMessages.splice(0, serviceMessages.length, ...messages.slice(0, maxRenderedMessages));
      renderServiceMessages();
    } catch (error) {
      console.error('load messages failed:', error);
    }
  }

  function initServiceMessages() {
    const toggleMessages = document.getElementById('toggleMessages');
    const messagePanel = document.getElementById('messagePanel');

    if (toggleMessages && messagePanel) {
      toggleMessages.addEventListener('click', () => {
        messagePanel.hidden = !messagePanel.hidden;
      });
    }

    renderServiceMessages();
    loadMessageHistory();

    const source = new EventSource('/events');
    source.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('service message:', message);
      addServiceMessage(message);
    };
  }

  initServiceMessages();
// // 說明：待確認
  // var quill = new Quill('#editor', {
  //   modules: {
  //     toolbar: '#toolbar'
  //   },
  //   theme: 'bubble',
  //   // Initialize as read-only
  //   readOnly: true,
  // });

  // // 說明：待確認
  // var Size = Quill.import('attributors/style/size');
  // Size.whitelist = ['16px', '18px', '20px', '24px'];
  // Quill.register(Size, true);

  // // 說明：待確認
  // // const quillData = {
  // //   "ops":[{"attributes":{"italic":true,"color":"#e60000","bold":true},"insert":"TTT"},
  // //   {"attributes":{"list":"ordered"},"insert":"\n"},{"attributes":{"italic":true,"color":"#008a00","background":"#ffff00","bold":true},"insert":"DDD"},
  // //   {"attributes":{"indent":2,"list":"ordered"},"insert":"\n"},{"attributes":{"strike":true},"insert":"WWW"},{"insert":"\n"}]
  // // };
  // const quillData =  { "ops": [{ insert: "\n" }] };

  // // 說明：待確認
  // quill.setContents(quillData);

  // // 說明：待確認
  // const quillCellRenderer = (params) => {
  //   const container = document.createElement('div');
  //   const quillDiv = document.createElement('div');
  //   container.appendChild(quillDiv);
  //   // 說明：待確認
  //   const tempQuill = new Quill(quillDiv, {
  //     theme: 'bubble',
  //     // readOnly: true
  //   });
  //   // 說明：待確認
  //   tempQuill.setContents(params.value); // 說明：待確認
  //   // console.log(JSON.stringify(params.value))
  //   container.innerHTML = tempQuill.root.innerHTML;  // 說明：待確認
  //   // console.log(tempQuill.root.innerHTML)
  //   container.classList.add('ql-editor','ql-editor-modify');
  //   // 說明：待確認
  //   return container;
  // };

  let quillInstances;
  const formContainer = document.getElementById('formContainer');
  const btnAndMyGrid = document.getElementById('btn_and_myGrid');

  // 說明：待確認
  const quillConfigs = [
    { editorId: 'editor-text-9', toolbarId: 'toolbar-9', 
      countId: 'charCount-9', maxChars: 50, variable: 'quillText9' },
    // { editorId: 'editor-text-10', toolbarId: 'toolbar-10', 
    // countId: 'charCount-10', maxChars: 100, variable: 'quillText10' },
  ];

  // 說明：待確認
  function initQuillEditors(configs) {
    const instances = {};

    configs.forEach(config => {
      const options = {
        theme: 'bubble',
        modules: {
          toolbar: `#${config.toolbarId}`
        }
      };

      // 說明：待確認
      const quill = new Quill(`#${config.editorId}`, options);

      // 說明：待確認
      instances[config.variable] = quill;

      // 說明：待確認
      quill.on('text-change', () => {
          updateCharCount(quill, config.countId, config.maxChars);
      });

      updateCharCount(quill, config.countId, config.maxChars);
    });

    return instances;
  }

  // 說明：待確認
  function updateCharCount(quill, countId, maxChars) {
    const text = quill.getText().trim();
    const remaining = maxChars - text.length;
    document.getElementById(countId).textContent = `${remaining} remaining words`;
  }

  /**/ // 說明：待確認
  const quillCellRenderer = (params) => {
      const container = document.createElement('div');
      const quillDiv = document.createElement('div');
      // quillDiv.classList.add('ql-editor');
      container.appendChild(quillDiv);

      // 說明：待確認
      const tempQuill = new Quill(quillDiv, {
          theme: 'bubble',
          readOnly: true
      });

      // // 說明：待確認
      // tempQuill.setContents(params.value);

      // 說明：待確認
      if (params.value && typeof params.value === 'object' && params.value.ops) {
          tempQuill.setContents(params.value);  // 說明：待確認
      } else {
          // 說明：待確認
          tempQuill.root.innerText = params.value || '';
      }

      container.innerHTML = tempQuill.root.innerHTML;  // 新容器內
      container.classList.add('ql-editor','ql-editor-modify');

      // 說明：待確認
      return container;
  };

  // 說明：待確認
  const remarkValueFormatter = (params) => {
    if (params.value && typeof params.value === 'object') {
      return JSON.stringify(params.value); // 說明：待確認
    }
    return params.value;
  };

  // // 說明：待確認
  // // 說明：待確認
  // const remarkValueParser = (params) => {
  //   // 說明：待確認
  //   if (params.newValue && typeof params.newValue === 'object') {
  //     return params.newValue;
  //   }
  //   // 說明：待確認
  //   try {
  //     return JSON.parse(params.newValue);
  //   } catch (e) {
  //     return params.newValue;
  //   }
  // };

  const remarkValueParser = (params) => {
    // 說明：待確認
    // 說明：待確認
    // 說明：待確認
    // 說明：待確認
    // 說明：待確認
    return JSON.parse(JSON.stringify(params.newValue));
  };

  function deleteCellRenderer(params) {
    const icon = document.createElement('i');
    icon.className = 'fa-regular fa-trash-can';
    icon.style.cursor = 'pointer';
    icon.title = '?芷??';

    icon.addEventListener('click', (e) => {
      e.stopPropagation(); // 說明：待確認

      const uuid = params.data?.uuid;
      if (!uuid) {
        console.warn('Missing uuid, cannot delete row:', params.data);
        return;
      }

      // 說明：待確認
      const ok = confirm(`蝣箏?閬?日?鞈???\nUUID: ${uuid}`);
      if (!ok) return;

      // alert(`uuid: ${uuid}`);

      // 說明：待確認
      fetch('deleteRow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            // 說明：待確認
            params.api.applyTransaction({ remove: [params.node.data] });
          } else {
            alert('Delete failed: ' + (result.message || 'Unknown error'));
          }
        })
        .catch((err) => {
          console.error('Delete request failed:', err);
          alert('Delete failed. Please check the server log.');
        });
    });

    return icon;
  }


  let gridApi;

  const columnDefs = [
    { field: "uuid",
      width:150, minWidth:150, maxWidth:150,
      hide: true,
    },
    { field: "port", headerName: "Port",
      width:150, minWidth:150, maxWidth:150,
      editable: true,
    },
    { field: "comment", headerName: "Comment",
      width:200, minWidth:200, maxWidth:200,
      cellClass: "multi-line-cell",
      editable: true,
    },
    {       
      field: "remark", headerName: "Remark",
      width:850, minWidth:850, maxWidth:850,
      cellRenderer: quillCellRenderer, // 說明：待確認
      valueFormatter: remarkValueFormatter, // 說明：待確認
      valueParser: remarkValueParser, // 說明：待確認
      cellEditor: QuillCellEditor, // 說明：待確認
      cellClass: "ag-quill-cell",
      editable: true,
    },
    {       
      field: 'actions', headerName: 'Actions',
      width:80, minWidth:80, maxWidth:80,
      cellRenderer: deleteCellRenderer,
      cellClass: "ag-center-cell-h",
      sortable: false,
      filter: false,
      editable: false,
      // suppressMenu: true,
    },
  ];

  const gridOptions = {
    columnDefs: columnDefs,
    rowData: [],
    // onCellValueChanged: CellValueChanged,
    defaultColDef: {
      // flex: 1,
      filter: true,
      floatingFilter: true,
      // 說明：待確認
      wrapText: true,
      autoHeight: true,
      // cellStyle: { display: 'flex', alignItems: 'center'},
      cellClass: "ag-center-cell",
      enableCellChangeFlash: true,
    },
    autoSizeStrategy: {
      type: "fitCellContents",
    },
    enableCellTextSelection: true,
    // onRowClicked: createRowClickHandler(),
    onRowDoubleClicked: createRowClickHandler(),
    getRowId: params => params.data?.uuid,
    // getRowId: params => {
    //   console.log("getRowId -> data:", params.data);
    //   console.log("getRowId -> uuid:", params.data?.uuid);
    //   return params.data?.uuid;
    // },
  };

  let clicked;
  function createRowClickHandler() {
    return function onRowClicked(event) {
    clicked = {
      ...event.data,   // 說明：待確認
      rowNode: event.node // 說明：待確認
    };
    console.log('clicked_data :', clicked);

    const hidden = formContainer.style.display === "none" || formContainer.style.display === "";
    if (hidden) {
      populateForm(clicked);
      formContainer.style.display = "flex"; btnAndMyGrid.style.display  = "none";
    } else {
      formContainer.style.display = "none"; btnAndMyGrid.style.display  = "flex";
    }
    };
  }

  function populateForm(data) {
    // console.log('clicked_data :', data);
    const fieldMap = {
      'text-1': 'port',
      'text-3': 'comment',
      // 'text-5': 'xxx',
      // 'text-7': 'yyy'
    };

    Object.entries(fieldMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = data[key] || '';
      }
    });

    // Quill
    const qs = [
        { key:'remark',  instanceKey:'quillText9' },
        // { key:'editor-text-10', instanceKey:'quillText10' },
    ];
    qs.forEach(({key, instanceKey})=>{
      const instance = quillInstances?.[instanceKey];
      console.log('quillInstances: ',quillInstances)
      const value = data[key];
      console.log('quill value: ',value)
      if (instance){
        if (value && typeof value === 'object' && value.ops) instance.setContents(value);
        else instance.setText(value ? String(value) : '');
      }
    });
  }

  // let isEditing = false;
  // let storedRows = [];
  // let previousRowUuid = null;
  // let previousRowIndex = null;
  // let debounceTimeout;

  // gridOptions.onCellEditingStarted = function(event) {
  //   isEditing = true; // 說明：待確認
  //   // 說明：待確認
  //   scheduleUpdate();
  //   // const editingCells = gridApi.getEditingCells();
  //   // 說明：待確認
  // };

  // gridOptions.onCellEditingStopped = function(event) {
  //   // console.log("結編輯欄:", event.colDef.field);
  //   // 說明：待確認
  //   const currentUuid = event.data.uuid;
  //   const currentRowIndex = event.rowIndex;
  //   const field = event.colDef.field;
  //   const newValue = event.newValue;
  //   console.log('event(EditingStopped):', event);

  //   const rowIndex = storedRows.findIndex(row => row.uuid === currentUuid);
  //   if (rowIndex === -1) {
  //     storedRows.push({ ...event.data });
  //     // 說明：待確認
  //   } else {
  //     storedRows[rowIndex][field] = newValue; //field = event.colDef.field & newValue = event.newValue;
  //     // console.log('新後資(EditingStopped):', storedRows[rowIndex]);
  //   }
  //   console.log('新後storedRows:', storedRows);
  //   previousRowUuid = currentUuid;
  //   previousRowIndex = currentRowIndex;

  //   // 說明：待確認
  //   isEditing = false;
  //   scheduleUpdate();
  // };  

  // function scheduleUpdate() {
  //   // 說明：待確認
  //   if (debounceTimeout) {
  //     clearTimeout(debounceTimeout);
  //   }
  //   // 說明：待確認
  //   debounceTimeout = setTimeout(() => {
  //     // 說明：待確認
  //     if (isEditing) {
  //       // 說明：待確認
  //       scheduleUpdate();
  //     } else {
  //       // 說明：待確認
  //       updateBackend(storedRows);
  //     }
  //   }, 3000);
  // }
  /** */

  // function fetchAndRenderData() {
  //   fetch('/data')
  //   .then(response => response.json())
  //   .then(dataArray => {
  //     console.log('dataArray: ',dataArray);
  //     gridApi.setGridOption('rowData', dataArray) // 說明：待確認
  //   })
  //   .catch(error => console.error('Error fetching data:', error));
  // }

  // 說明：待確認
  /** */
  function fetchAndRenderData() {
    fetch('data')
    .then(response => response.json())
    .then(dataArray => {
      console.log('dataArray: ',dataArray);
      gridApi.setGridOption('rowData', dataArray)
    })
    .catch(error => console.error('Error fetching data:', error));
    // gridApi.setGridOption('rowData', [])
  }

  /** 2) 取得或建立 uuid，必要時使用 fallback。 */
  function genUUID() {
    return uuid.v4();
  }

  /** 3) 將資料填入表單，並將 clicked 指向 rowNode。 */
  function openFormFor(rowNode) {
    clicked = { uuid: rowNode.data.uuid, rowNode };
    // 說明：待確認
    document.getElementById('text-1').value = rowNode.data.port ?? '';
    document.getElementById('text-3').value = rowNode.data.comment ?? '';
    // quill remark
    if (quillInstances?.quillText9) {
      try {
        quillInstances.quillText9.setContents(rowNode.data.remark || '');
      } catch {
        quillInstances.quillText9.setText(''); // 說明：待確認
      }
    }
    // 說明：待確認
    formContainer.style.display = "flex";
    btnAndMyGrid.style.display = 'none';
  }

  document.getElementById('toggleForm').addEventListener('click', function () {
    const uuid = genUUID();

    // 說明：待確認
    const newRow = {
      uuid,
      port: '',
      comment: '',
      remark: '',                 // 說明：待確認
      // createdAt: new Date().toISOString(),
    };

    console.log('newRow: ',newRow)

    // 說明：待確認
    const tx = gridApi.applyTransaction({ add: [newRow], addIndex: 0 });
    console.log('tx: ',tx)
    const rowNode = tx?.add?.[0];
    if (!rowNode) { alert('Failed to add row.'); return; }

    // 說明：待確認
    rowNode.setSelected(true);
    gridApi.ensureNodeVisible(rowNode, 'top');
    gridApi.flashCells?.({ rowNodes: [rowNode], columns: ['port', 'comment', 'remark'] });
    openFormFor(rowNode);

    // 說明：待確認
    // 說明：待確認
    // 說明：待確認
    updateBackend(newRow);
  });

  // document.getElementById('toggleForm').addEventListener('click', function () {
  //   if (formContainer.style.display === "none" || formContainer.style.display === "") {
  //     // // 說明：待確認
  //     // const timeToCheck = getCurrentTime(); // 說明：待確認
  //     // document.getElementById('form').reset(); // 置表單

  //     // // 說明：待確認
  //     // fetch(`/checkData?time=${encodeURIComponent(timeToCheck)}`)
  //     // .then(response => {
  //     //   if (!response.ok) {
  //     //     throw new Error('Failed to fetch data');
  //     //   }
  //     //   return response.json();
  //     // })
  //     // .then(data => {
  //     //   console.log('fetch data: ', data);
  //     //   if (data.data) {
  //     //     // 說明：待確認
  //     //     existingTime = data.data.Time;
  //     //     // populateForm(data.data); // 填表單
  //     //     console.log('Existing data found, form populated.');
  //     //   } else {
  //     //     // 說明：待確認
  //     //     console.log('No existing data found, opening empty form');
  //     //     existingTime = null; // 說明：待確認
  //     //     document.getElementById('form').reset(); // 置表單
  //     //   }
  //     //   formContainer.style.display = "flex"; // 顯示表單form
  //     //   btnAndMyGrid.style.display = "none"; // 隱藏 btn_and_myGrid
  //     // })
  //     // .catch(error => console.error('Unexpected Error:', error)); // 說明：待確認
  //     formContainer.style.display = "flex"; // 顯示表單form
  //     btnAndMyGrid.style.display = "none"; // 隱藏 btn_and_myGrid
  //   } else {
  //     formContainer.style.display = "none"; // 說明：待確認
  //     btnAndMyGrid.style.display = "flex"; // 顯示 btn_and_myGrid
  //   }
  // });

  document.getElementById('closeButton').addEventListener('click', function () {        
    formContainer.style.display = "none"; // 說明：待確認
    btnAndMyGrid.style.display = "flex"; // 顯示 btn_and_myGrid
  });

  async function uploadEmbeddedImages(delta) {
    if (!delta || !Array.isArray(delta.ops)) return delta;

    const ops = await Promise.all(delta.ops.map(async op => {
      const image = op?.insert?.image;
      if (typeof image !== 'string' || !image.startsWith('data:image/')) return op;

      const response = await fetch('uploadImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: image })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) {
        throw new Error(result.message || `Image upload failed (HTTP ${response.status})`);
      }

      return {
        ...op,
        insert: { ...op.insert, image: result.url }
      };
    }));

    return { ...delta, ops };
  }

  // document.getElementById('form').addEventListener('submit', function(event) {
  //   event.preventDefault(); // 說明：待確認

  //   if (!clicked || !clicked.rowNode) {
  //     alert('Delete failed. Please check the server log.');
  //     return;
  //   }

  //   // 說明：待確認
  //   const patch = {
  //     "port": document.getElementById('text-1').value,
  //     "comment": document.getElementById('text-3').value,
  //   };
  //   // 取得 Quill Delta
  //   if (quillInstances?.quillText9)  patch["remark"]  = quillInstances.quillText9.getContents();
  //   patch["uuid"]  = clicked?.uuid;
  //   console.log('patch: ',patch)
  //   console.log('clicked_data at submit: ', clicked)
  //   fetch('/saveData', 
  //   {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify(patch)
  //   })
  //   // .then(response => response.json())
  //   // 說明：待確認
  //   .then(response => {
  //       return response.json(); // 說明：待確認
  //   })
  //   .then(savedData => {
  //     alert(savedData.message);
  //     document.getElementById('form').reset();
  //     // existingTime = null; // 說明：待確認
  //     formContainer.style.display = "none"; // 說明：待確認
  //     btnAndMyGrid.style.display = "flex"; // 顯示 btn_and_myGrid

  //     // 說明：待確認
  //     fetchAndRenderData();
  //   })
  //   .catch(error => console.error('Error:', error));

  //   // 置表單
  //   document.getElementById('form').reset();
  //   clicked = null; // 說明：待確認
  //   formContainer.style.display = "none"; // 說明：待確認
  //   btnAndMyGrid.style.display = "flex";
  // });
    

  document.getElementById('form').addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!clicked || !clicked.rowNode) {
      alert('Delete failed. Please check the server log.');
      return;
    }

    // 說明：待確認
    const rowNode = clicked.rowNode;
    console.log('rowNode: ',rowNode)
    const prevData = { ...rowNode.data };

    // 3) 到後端
    try {
      const remark = await uploadEmbeddedImages(
        quillInstances?.quillText9?.getContents?.() ?? ''
      );
      const patch = {
        port:    document.getElementById('text-1').value,
        comment: document.getElementById('text-3').value,
        remark,
        uuid:    clicked.uuid
      };

      Object.keys(patch).forEach(k => rowNode.setDataValue(k, patch[k]));  // 更新欄位
      gridApi.flashCells?.({ rowNodes: [rowNode], columns: Object.keys(patch) });

      const resp = await fetch('saveData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const saved = await resp.json();
      alert(saved.message || 'Saved!');
    } catch (err) {
      console.error('Save request failed:', err);
      // 說明：待確認
      rowNode.setData(prevData);
      alert(`Save failed: ${err.message}`);
    } finally {
      // 說明：待確認
      document.getElementById('form').reset();
      formContainer.style.display = "none";
      btnAndMyGrid.style.display  = "flex";
      clicked = null; // 說明：待確認
    }
  });
  /** */
  function updateBackend(updatedRow) {
    // 說明：待確認
    fetch('saveData', 
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
        fetchAndRenderData(); // 說明：待確認
      })
      .catch(error => console.error('Error:', error));
  }

  // function createNewRowData() { 
  //   const newData = { uuid: (crypto.randomUUID && crypto.randomUUID()) || ('uuid-' + Math.random().toString(36).substr(2, 9)),
  //     make: "",
  //     model: "",
  //     price: null,
  //     electric: false,
  //     remark: { ops: [{ insert: "\n" }] } // 空白 Quill Delta
  //   };
  //   return newData;
  // }

  // function addItems() {
  //   // 說明：待確認
  //   gridApi.applyTransaction({ add: [createNewRowData()] });
  // }
  // // 說明：待確認
  // function cssColorToARGB(cssColor) {
  //   if (cssColor[0] === '#') {
  //     return 'FF' + cssColor.substring(1).toUpperCase();
  //   }
  //   return cssColor;
  // }

  /**
   * 將 Quill Delta 轉換為 ExcelJS Rich Text。
   * 規則：
   * 1. 每個文字片段預設使用 Calibri 字型。
   * 2. 將 bold、italic、underline、strike、color 等屬性套用至字型。
   * 3. 處理 ordered 與 bullet 清單的前綴文字。
   * 4. 清單前綴處理完成後，略過對應的換行操作。
   * 5. 回傳可供 ExcelJS 使用的 Rich Text 陣列。
   */
  // function convertDeltaToRichText(delta) {
  //   const ops = delta.ops || [];
  //   const richTextArray = [];
  //   let i = 0;

  //   while (i < ops.length) {
  //     const op = ops[i];
  //     // 說明：待確認
  //     if (typeof op.insert === 'string') {
        
  //       // 說明：待確認
  //       let text = op.insert;
  //       let font = { name: 'Calibri' };
  //       let hasAttributes = false;
  //       // console.log(JSON.stringify(text),"i: ",i); // 說明：待確認

  //       if (op.attributes) {
  //         hasAttributes = true;
  //         if (op.attributes.bold) font.bold = true;
  //         if (op.attributes.italic) font.italic = true;
  //         if (op.attributes.underline) font.underline = true;
  //         if (op.attributes.strike) font.strike = true;
  //         if (op.attributes.color) {
  //           font.color = { argb: cssColorToARGB(op.attributes.color) };
  //         }
  //       }
  //       if (op && op.insert === "\n" && op.attributes && op.attributes.list) {
  //         if (op.attributes.list === 'bullet') {
  //           // console.log('richTextArray.length: ',richTextArray.length)
  //           let j = richTextArray.length -1;
  //           while (j >= 0) {
  //             // console.log('j: ',j)
  //             if (richTextArray[j].hasAttributes === false) {
  //               const currentText = richTextArray[j].text;
  //               if (currentText === "\n") {
  //                 // 如該素 text 完全等於 "\n"
  //                 // console.log("currentText === n")
  //                 const prevText = richTextArray[j + 1].text;
  //                 richTextArray[j + 1].text = '• ' + prevText;
  //               } 
  //               else if (currentText.includes("\n")) {
  //                 // 說明：待確認
  //                 // 說明：待確認
  //                 const match = currentText.match(/^(\n+)(.*)/);
  //                 if (match) {
  //                   // 說明：待確認
  //                   richTextArray[j].text = match[1] + '• ' + match[2];
  //                 } else {
  //                   // 說明：待確認
  //                   richTextArray[j].text = '• ' + currentText;
  //                 }
  //               } 
  //               else {
  //                 // 說明：待確認
  //                 richTextArray[j].text = '• ' + currentText;
  //               }
  //               break; // 說明：待確認
  //             }
  //             j--;
  //           }
  //         } 
  //         else if (op.attributes.list === 'ordered') {
  //           // console.log('richTextArray.length: ',richTextArray.length)
  //           let j = richTextArray.length -1;
  //           while (j >= 0) {
  //             // console.log('j: ',j)
  //             if (richTextArray[j].hasAttributes === false) {
  //               const currentText = richTextArray[j].text;
  //               if (currentText === "\n") {
  //                 // 如該素 text 完全等於 "\n"
  //                 // console.log("currentText === n")
  //                 const prevText = richTextArray[j + 1].text;
  //                 richTextArray[j + 1].text = '• ' + prevText;
  //               } 
  //               else if (currentText.includes("\n")) {
  //                 // 說明：待確認
  //                 // 說明：待確認
  //                 const match = currentText.match(/^(\n+)(.*)/);
  //                 if (match) {
  //                   richTextArray[j].text = match[1] + '• ' + match[2];
  //                 } else {
  //                   richTextArray[j].text = '• ' + currentText;
  //                 }
  //               } 
  //               else {
  //                 richTextArray[j].text = '• ' + currentText;
  //               }
  //               break; // 說明：待確認
  //             }
  //             j--;
  //           }
  //         }
  //       } 
  //       i++;
  //       // 說明：待確認
  //       richTextArray.push({ text, font, hasAttributes });      
  //     } else {
  //       // 說明：待確認
  //       richTextArray.push({ text, font, hasAttributes }); 
  //       i++;
  //     }

  //   }
  //   richTextArray.forEach((item, index) => {
  //     // 說明：待確認
  //   });    
  //   if (richTextArray.length > 0 && richTextArray[richTextArray.length - 1].text === "\n") {
  //     richTextArray.pop();
  //   }
  //   return richTextArray.map(item => ({ text: item.text, font: item.font })); // 說明：待確認
  // }

  // // 用 SheetJS 出 Excel (XLSX) 檔
  // async function onBtnExportExcel() {
  //   const rowData = [];
  //   gridApi.forEachNode(function (node) {
  //     rowData.push(node.data);
  //   });
  //   if (rowData.length === 0) {
  // 說明：待確認
  //     return;
  //   }
  //   // 說明：待確認
  //   // const exportData = rowData.slice(0, 20);
  //   const exportData = [];
  //   rowData.slice(0, 20).map(originalRow => {
  //     // 說明：待確認
  //     const row1 = { ...originalRow };
  //     row1.remark = convertDeltaToRichText({ ops: [{ insert: "是第筆row資" }] });
  //     // 說明：待確認
  //     row1.priceCopy = row1.price;
      
  //     // 說明：待確認
  //     const row2 = { ...originalRow };
  //     if (row2.remark && typeof row2.remark === 'object') {
  //       row2.remark = convertDeltaToRichText(row2.remark);
  //     }
  //     // 說明：待確認
  //     row2.priceCopy = row2.price;
      
  //     exportData.push(row1, row2);
  //   });
  //   console.log('exportData: ',exportData)

  //   // 說明：待確認
  //   const workbook = new ExcelJS.Workbook();
  //   const worksheet = workbook.addWorksheet('Sheet1');
    
  //   worksheet.columns = [ // 說明：待確認
  //     { header: 'Make', key: 'make', width: 20},
  //     { header: 'Model', key: 'model', width: 20},
  //     { header: 'Price', key: 'price', width: 10 },
  //     { header: 'Price', key: 'priceCopy', width: 10 },
  //     { header: 'Electric', key: 'electric', width: 10 },
  //     { header: 'Remark', key: 'remark', width: 40 },
  //   ];
  //   // 說明：待確認
  //   exportData.forEach((row) => {
  //     const newRow =worksheet.addRow({
  //       // 說明：待確認
  //       make: (row.make !== undefined && row.make !== null) ? String(row.make) : '',
  //       model: (row.model !== undefined && row.model !== null) ? String(row.model) : '',
  //       // 說明：待確認
  //       price: typeof row.price === 'number' ? row.price : Number(row.price),
  //       priceCopy: typeof row.priceCopy === 'number' ? row.priceCopy : Number(row.priceCopy),
  //       electric: row.electric,
  //       remark: row.remark ? { richText: row.remark } : '' // 說明：待確認
  //     });
  //     // 說明：待確認
  //     if (newRow.number > 1) {
  //       // 說明：待確認
  //       worksheet.mergeCells(newRow.number, 3, newRow.number, 4);
  //     }
      
  //   });

  //   // // 說明：待確認
  //   // worksheet.eachRow((row) => {
  //   //   row.eachCell((cell) => {
  //   //     if (!cell.font) {
  //   //       cell.font = { name: 'Calibri' };
  //   //     }
  //   //   });
  //   // });
  //   worksheet.eachRow((row) => {
  //     row.eachCell((cell, colNumber) => {
  //       if (!cell.font) {
  //         cell.font = { name: 'Calibri' };
  //       }
  //       // 說明：待確認
  //       // 說明：待確認
  //       // const remarkCell = cell.getCell(5); // 說明：待確認
  //       // if (remarkCell.value) {
  //       //   cell.alignment = { wrapText: true };
  //       // }
  //       // 說明：待確認
  //       // if (colNumber === 5 && cell.value) {
  //       //   cell.alignment = { wrapText: true };
  //       // }
  //           // 說明：待確認
  //       if (colNumber === 5 && cell.value) {
  //         // cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  //         cell.alignment = { vertical: 'middle', wrapText: true };
  //       } else {
  //         // 說明：待確認
  //         cell.alignment = { horizontal: 'center', vertical: 'middle' };
  //       }
  //     });
  //   });

  //   // worksheet.eachRow((row) => {
  //   //   // 說明：待確認
  //   //   const remarkCell = row.getCell(5); // 說明：待確認
  //   //   if (remarkCell.value) {
  //   //     row.height = 60; // 說明：待確認
  //   //   }
  //   // });    

  //   // 說明：待確認
  //   const buf = await workbook.xlsx.writeBuffer();
  //   const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'exported_data.xlsx';
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // }

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

  // async function onBtnExportExcel() {
  //   const rowData = [];
  //   gridApi.forEachNode(function (node) {
  //     rowData.push(node.data);
  //   });
  //   if (rowData.length === 0) {
  // 說明：待確認
  //     return;
  //   }
  
  //   // 說明：待確認
  //   const workbook = new ExcelJS.Workbook();
  //   const worksheet = workbook.addWorksheet('Sheet1');
  
  //   worksheet.columns = [
  //     { header: 'Make', key: 'make', width: 20 },
  //     { header: 'Model', key: 'model', width: 20 },
  //     { header: 'Price', key: 'price', width: 10 },
  //     { header: 'Price', key: 'priceCopy', width: 10 },
  //     { header: 'Electric', key: 'electric', width: 10 },
  //     { header: 'Remark', key: 'remark', width: 40 },
  //   ];
  
  //   // 說明：待確認
  //   rowData.slice(0, 20).forEach(originalRow => {
  //     // 說明：待確認
  //     const row1Data = { ...originalRow };
  //     row1Data.remark = convertDeltaToRichText({ ops: [{ insert: "是第筆row資" }] });
  //     row1Data.priceCopy = row1Data.price;

  //     // 說明：待確認
  //     const matchedItem = make_list.find(item => item.make === row1Data.make);
  //     if (matchedItem) {
  //       // 說明：待確認
  //       row1Data.price = matchedItem["Price MB"];
  //       // row1Data.priceCopy = matchedItem["Price Chall."];
  //     }
      
  //     // 說明：待確認
  //     const row2Data = { ...originalRow };
  //     if (row2Data.remark && typeof row2Data.remark === 'object') {
  //       row2Data.remark = convertDeltaToRichText(row2Data.remark);
  //     }
  //     row2Data.priceCopy = row2Data.price;
  
  //     // 將 row1 與 row2 加入 worksheet
  //     const newRow1 = worksheet.addRow({
  //       make: row1Data.make != null ? String(row1Data.make) : '',
  //       model: row1Data.model != null ? String(row1Data.model) : '',
  //       price: typeof row1Data.price === 'number' ? row1Data.price : Number(row1Data.price),
  //       priceCopy: typeof row1Data.priceCopy === 'number' ? row1Data.priceCopy : Number(row1Data.priceCopy),
  //       electric: row1Data.electric,
  //       remark: row1Data.remark ? { richText: row1Data.remark } : ''
  //     });
  //     const newRow2 = worksheet.addRow({
  //       make: row2Data.make != null ? String(row2Data.make) : '',
  //       model: row2Data.model != null ? String(row2Data.model) : '',
  //       price: typeof row2Data.price === 'number' ? row2Data.price : Number(row2Data.price),
  //       priceCopy: typeof row2Data.priceCopy === 'number' ? row2Data.priceCopy : Number(row2Data.priceCopy),
  //       electric: row2Data.electric,
  //       remark: row2Data.remark ? { richText: row2Data.remark } : ''
  //     });  
  //     // 說明：待確認
  //     const priceColNumber = worksheet.getColumn('price').number;        // 說明：待確認
  //     const priceCopyColNumber = worksheet.getColumn('priceCopy').number;  // 說明：待確認
  //     worksheet.mergeCells(newRow1.number, priceColNumber, newRow1.number, priceCopyColNumber);
  //     worksheet.mergeCells(newRow2.number, priceColNumber, newRow2.number, priceCopyColNumber);
      
  //     // 說明：待確認
  //     const electricColNumber = worksheet.getColumn('electric').number;
  //     worksheet.mergeCells(newRow1.number, electricColNumber, newRow2.number, electricColNumber);

  //     // 說明：待確認
  //     const priceColumn = worksheet.getColumn('price');
  //     console.log('Price column header:', priceColumn.header);
  //     worksheet.getColumn('price').header = 'Price MB';
  //     // 說明：待確認
  //     worksheet.getColumn('priceCopy').header = 'Price chall';

  //   });

  //   const remarkColNumber = worksheet.getColumn('remark').number;
  //   // 說明：待確認
  //   worksheet.eachRow((row) => {
  //     row.eachCell((cell, colNumber) => {
  //       if (!cell.font) {
  //         cell.font = { name: 'Calibri' };
  //       }
  //       // 說明：待確認
  //       if (colNumber === remarkColNumber  && cell.value) {
  //         cell.alignment = { vertical: 'middle', wrapText: true };
  //       } else {
  //         cell.alignment = { horizontal: 'center', vertical: 'middle' };
  //       }
  //     });
  //   });
  
  //   // 說明：待確認
  //   const buf = await workbook.xlsx.writeBuffer();
  //   const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  //   const url = window.URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'exported_data.xlsx';
  //   a.click();
  //   window.URL.revokeObjectURL(url);
  // }
  

  // function ShowExcel() {
  //   const rowData = [];
  //   gridApi.forEachNode(function (node) {
  //     rowData.push(node.data);
  //     console.log(node.data)
  //   });
  //   if (rowData.length === 0) {
  // 說明：待確認
  //     return;
  //   }
  // }

  // 說明：待確認
  /**/
  document.addEventListener('DOMContentLoaded', function() {

    // 說明：待確認
    quillInstances = initQuillEditors(quillConfigs);

    const myGridElement = document.querySelector('#myGrid');
    gridApi = agGrid.createGrid(myGridElement, gridOptions); 
    requestAnimationFrame(() => {
      gridApi.sizeColumnsToFit?.();
    });
    
    // let rowData = [
    //   {make: "Tesla", model: "Model Y", price: 64950, electric: true, remark: quillData},
    //   {make: "Ford", model: "F-Series", price: 33850, electric: true, remark: quillData},
    //   {make: "Toyota", model: "Corolla", price: 29600, electric: true, remark: quillData},
    // ];

    // // 說明：待確認
    // rowData   = rowData.map(item => {
    //   // 說明：待確認
    //   const uuid = (crypto.randomUUID && crypto.randomUUID()) || ('uuid-' + Math.random().toString(36).substr(2, 9));
    //   // 說明：待確認
    //   return { uuid, ...item };
    // });

    // // 說明：待確認
    // console.log(rowData);
    fetchAndRenderData();

    // // 說明：待確認
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

    // // 說明：待確認
    // gridApi.setGridOption('rowData', rowData);
  });









