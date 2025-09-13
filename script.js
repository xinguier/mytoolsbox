// 获取DOM元素
const inputTextarea = document.getElementById("input");
const outputTextarea = document.getElementById("output");
const formatBtn = document.getElementById("format");
const compressBtn = document.getElementById("compress");
const copyBtn = document.getElementById("copy");
const clearBtn = document.getElementById("clear");

/**
 * 格式化JSON：添加缩进，便于阅读
 */
formatBtn.addEventListener("click", () => {
  try {
    const input = inputTextarea.value.trim();
    if (!input) {
      alert("请输入JSON内容");
      return;
    }
    // 解析JSON（若格式错误，进入catch）
    const parsedJSON = JSON.parse(input);
    // 格式化并缩进2个空格
    const formattedJSON = JSON.stringify(parsedJSON, null, 2);
    outputTextarea.value = formattedJSON;
    alert("JSON格式化成功！");
  } catch (error) {
    alert("JSON格式错误：" + error.message);
  }
});

/**
 * 压缩JSON：去除所有空格和换行，减小体积
 */
compressBtn.addEventListener("click", () => {
  try {
    const input = inputTextarea.value.trim();
    if (!input) {
      alert("请输入JSON内容");
      return;
    }
    // 解析JSON（若格式错误，进入catch）
    const parsedJSON = JSON.parse(input);
    // 压缩为紧凑格式（无缩进、无多余空格）
    const compressedJSON = JSON.stringify(parsedJSON);
    outputTextarea.value = compressedJSON;
    alert("JSON压缩成功！");
  } catch (error) {
    alert("JSON格式错误：" + error.message);
  }
});

/**
 * 复制结果：将右侧输出框内容复制到剪贴板
 */
copyBtn.addEventListener("click", () => {
  const output = outputTextarea.value.trim();
  if (!output) {
    alert("没有可复制的内容");
    return;
  }
  // 调用浏览器剪贴板API
  navigator.clipboard
    .writeText(output)
    .then(() => {
      alert("内容已复制到剪贴板！");
    })
    .catch((error) => {
      alert("复制失败：" + error.message);
    });
});

/**
 * 清空内容：重置输入和输出框
 */
clearBtn.addEventListener("click", () => {
  inputTextarea.value = "";
  outputTextarea.value = "";
  alert("内容已清空！");
});
