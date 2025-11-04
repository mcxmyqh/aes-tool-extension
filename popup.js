document.addEventListener('DOMContentLoaded', () => {
  const encryptRadio = document.getElementById('encryptRadio');
  const decryptRadio = document.getElementById('decryptRadio');
  const textRadio = document.getElementById('textRadio');
  const fileRadio = document.getElementById('fileRadio');

  const passwordEl = document.getElementById('password');
  const showPasswordEl = document.getElementById('showPassword');
  const inputTextEl = document.getElementById('inputText');
  const outputTextEl = document.getElementById('outputText');
  const fileInputEl = document.getElementById('fileInput');
  const fileStatusEl = document.getElementById('fileStatus');
  const filePreviewEl = document.getElementById('filePreview');
  const textRowEl = document.getElementById('textRow');
  const fileRowEl = document.getElementById('fileRow');
  const runBtn = document.getElementById('runBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadLink = document.getElementById('downloadLink');

  let currentFile = null;
  const getMode = () => encryptRadio.checked ? 'encrypt' : 'decrypt';

  // 显示/隐藏密码
  showPasswordEl.addEventListener('change', () => {
    passwordEl.type = showPasswordEl.checked ? 'text' : 'password';
  });

  // 类型切换：文本 / 文件
  const updateTypeDisplay = () => {
    if (textRadio.checked) {
      textRowEl.style.display = 'block';
      fileRowEl.style.display = 'none';
      fileInputEl.value = '';
      filePreviewEl.value = '';
      fileStatusEl.textContent = '未选择文件';
      fileStatusEl.className = 'muted';
      currentFile = null;
    } else {
      textRowEl.style.display = 'none';
      fileRowEl.style.display = 'block';
    }
  };
  textRadio.addEventListener('change', updateTypeDisplay);
  fileRadio.addEventListener('change', updateTypeDisplay);

  // 文件选择与预览
  fileInputEl.addEventListener('change', () => {
    currentFile = fileInputEl.files[0] || null;
    if (currentFile) {
      fileStatusEl.textContent = `已选择: ${currentFile.name}`;
      fileStatusEl.className = 'muted';
      const reader = new FileReader();
      reader.onload = (e) => filePreviewEl.value = e.target.result || '';
      reader.onerror = () => {
        fileStatusEl.textContent = '读取文件失败';
        fileStatusEl.className = 'error';
      };
      reader.readAsText(currentFile);
    } else {
      fileStatusEl.textContent = '未选择文件';
      fileStatusEl.className = 'muted';
      filePreviewEl.value = '';
    }
  });

  // 清空按钮
  clearBtn.addEventListener('click', () => {
    inputTextEl.value = '';
    outputTextEl.value = '';
    passwordEl.value = '123456';
    showPasswordEl.checked = false;
    passwordEl.type = 'password';
    fileInputEl.value = '';
    fileStatusEl.textContent = '未选择文件';
    fileStatusEl.className = 'muted';
    filePreviewEl.value = '';
    downloadLink.style.display = 'none';
    currentFile = null;
  });

  // 执行加密 / 解密
  runBtn.addEventListener('click', async () => {
    outputTextEl.value = '';
    downloadLink.style.display = 'none';
    const mode = getMode();
    const type = textRadio.checked ? 'text' : 'file';
    const pwd = passwordEl.value.trim();

    if (!pwd) { alert('请输入密码！'); return; }

    try {
      if (type === 'text') {
        const text = inputTextEl.value.trim();
        if (!text) {
          fileStatusEl.textContent = '文本内容为空';
          fileStatusEl.className = 'error';
          return;
        }
        if (mode === 'encrypt') {
          const b64 = await encryptText(text, pwd);
          outputTextEl.value = b64;
          prepareDownload(b64, 'text_encode.txt');
        } else {
          try {
            const plain = await decryptText(text, pwd);
            outputTextEl.value = plain;
            prepareDownload(plain, 'text_decode.txt');
          } catch {
            fileStatusEl.textContent = '解密失败：密码错误或数据损坏';
            fileStatusEl.className = 'error';
          }
        }
      } else {
        if (!currentFile) {
          fileStatusEl.textContent = '未选择文件';
          fileStatusEl.className = 'error';
          return;
        }
        const arrayBuffer = await currentFile.arrayBuffer();
        if (mode === 'encrypt') {
          const b64 = await encryptBytes(arrayBuffer, pwd);
          outputTextEl.value = b64;
          prepareDownload(b64, currentFile.name.replace(/\.[^/.]+$/, '') + '_encode.txt');
        } else {
          try {
            const b64source = filePreviewEl.value.trim();
            const plainBuf = await decryptToBytes(b64source, pwd);
            const plainStr = new TextDecoder().decode(plainBuf);
            outputTextEl.value = plainStr;
            const blob = new Blob([plainBuf], { type: 'application/octet-stream' });
            prepareDownloadFromBlob(blob, currentFile.name.replace(/\.[^/.]+$/, '') + '_decode.txt');
          } catch {
            fileStatusEl.textContent = '解密失败：密码错误或数据损坏';
            fileStatusEl.className = 'error';
          }
        }
      }
    } catch (err) {
      console.error(err);
      fileStatusEl.textContent = '处理失败: ' + err.message;
      fileStatusEl.className = 'error';
    }
  });

  // 复制结果
  copyBtn.addEventListener('click', async () => {
    const text = outputTextEl.value;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    fileStatusEl.textContent = '已复制到剪贴板';
    fileStatusEl.className = 'muted';
  });

  function prepareDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    prepareDownloadFromBlob(blob, filename);
  }
  function prepareDownloadFromBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.textContent = '下载: ' + filename;
    downloadLink.style.display = 'inline-block';
  }
});
