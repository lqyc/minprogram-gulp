// 工具方法
// 格式化时间
const formatNum = (value) => {
  const str = value.toString();
  return str[1] ? str : `0${str}`;
};
const formatDate = (time) => {
  const year = time.getFullYear();
  const month = time.getMonth() + 1;
  const day = time.getDate();

  const hour = time.getHours();
  const minute = time.getMinutes();
  const second = time.getSeconds();
  const millisecond = time.getMilliseconds();

  const date = [year, month, day].map(formatNum).join('/');
  time = [hour, minute, second].map(formatNum).join(':');

  return `${date} ${time}.${millisecond}`;
};

export default {
  formatDate
}
