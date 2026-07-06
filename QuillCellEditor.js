    // QuillCellEditor.js
    function QuillCellEditor() {}

    QuillCellEditor.prototype.init = function(params) {
    // console.log('觸發編輯的欄位:', params.colDef.field);
    console.log('觸發編輯的headerName:', params.colDef.headerName);
    // console.log('觸發QuillCellEditor:', params);
    this.params = params;
    this.cancel = false;  // 用來判斷是否取消編輯

    // 建立 popup 的主要容器，背景設定為 30% 透明的灰色
    this.container = document.createElement('div');
    this.container.classList.add('quill-cell-editor-popup');
    this.container.style.position = 'fixed';
    //   this.container.style.backgroundColor = 'rgba(128, 128, 128, 0.3)';
    this.container.style.backgroundColor = '#fff';
    this.container.style.padding = '10px';
    //   this.container.style.zIndex = 1000;
    this.container.style.border = '1px solid #ddd';
    this.container.style.boxShadow = '0px 10px 15px rgba(0, 0, 0, 0.1)';

    // 在 init 方法的最後，加入事件監聽器
    this.container.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // 建立 Quill 編輯器的區塊
    this.editorDiv = document.createElement('div');
    this.editorDiv.classList.add('quill-cell-editor');
    this.editorDiv.style.height = '150px';
    this.editorDiv.style.backgroundColor = '#f3f3f3';
    this.editorDiv.style.border = '1px solid #ddd';
    this.editorDiv.style.fontFamily = 'inherit';
    this.container.appendChild(this.editorDiv);

    // 建立按鈕容器
    this.buttonContainer = document.createElement('div');
    this.buttonContainer.style.marginTop = '6px';
    this.buttonContainer.style.textAlign = 'right';

    // 建立 Cancel 按鈕 (退出編輯)
    this.cancelButton = document.createElement('button');
    this.cancelButton.innerText = 'Cancel';
    this.cancelButton.style.marginRight = '6px';
    this.cancelButton.classList.add('cancel-btn'); // 绑定 class "cancel-btn"
    this.cancelButton.style.color = '#fff';
    this.cancelButton.style.background = 'rgb(236, 95, 149)';
    this.cancelButton.style.borderRadius = '5px';
    this.cancelButton.style.padding = '3px 11px';
    this.cancelButton.style.cursor = 'pointer';
    this.cancelButton.style.border = 'none';
    this.cancelButton.addEventListener('click', () => {
        this.cancel = true;
        params.stopEditing();
    });
    this.buttonContainer.appendChild(this.cancelButton);

    // 建立 Check 按鈕 (提交編輯結果)
    this.checkButton = document.createElement('button');
    this.checkButton.innerText = 'Check';
    this.checkButton.style.color = '#fff';
    this.checkButton.style.background = 'rgb(10, 123, 66)';
    this.checkButton.style.borderRadius = '5px';
    this.checkButton.style.padding = '3px 11px';
    this.checkButton.style.cursor = 'pointer';
    this.checkButton.style.border = 'none';
    // this.checkButton.addEventListener('click', () => {
    //     params.stopEditing();
    // });
    this.checkButton.addEventListener('click', () => {
        if (this.quill) {
            this.quill.blur();
        }
        // console.log(this.quill.root.innerHTML); // 取得 HTML 格式的內容並顯示在控制台
        this.params.stopEditing();
    });
    
    this.buttonContainer.appendChild(this.checkButton);

    // 將按鈕容器加入主要容器
    this.container.appendChild(this.buttonContainer);

    // 初始化 Quill 編輯器，使用 bubble 主題及工具列
    this.quill = new Quill(this.editorDiv, {
        theme: 'bubble',
        modules: {
        toolbar: [
            // [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline','strike'],
            // ['image', 'code-block']
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            // [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'color': [] }, { 'background': [] }]
        ]
        }
    });

    // 如果有傳入初始內容 (假設為 Delta 物件)
    if (params.value) {
        this.quill.setContents(params.value);
    }
    // 稍後讓編輯器獲取焦點
    setTimeout(() => {
        this.quill.focus();
    }, 0);
    };

    QuillCellEditor.prototype.getGui = function() {
    return this.container;
    };

    QuillCellEditor.prototype.afterGuiAttached = function() {
    // 編輯器顯示後可以進行進一步處理
    };

    QuillCellEditor.prototype.getValue = function() {
    // 返回編輯器中的內容 (以 Delta 格式)
    return this.quill.getContents();
    };

    QuillCellEditor.prototype.isCancelAfterEnd = function() {
    // 如果使用者點擊 Cancel，則取消此次編輯
    return this.cancel;
    };

    QuillCellEditor.prototype.destroy = function() {
    // 可在此處做必要的清理
    };

    QuillCellEditor.prototype.isPopup = function() {
    // 返回 true 表示以 popup 方式顯示編輯器
    return true;
    // return false;
    };
