self.addEventListener('message', function (e) {
    const start = e.data.start;
    const end = e.data.end;
    let count = 0;
    let batchCount = 0;
    const BATCH_SIZE = 1000; // 每1000个数字报告一次进度

    // 检查一个数是否为质数
    function isPrime(num) {
        if (num < 2) return false;
        if (num === 2) return true;
        if (num % 2 === 0) return false;

        for (let i = 3; i * i <= num; i++) {
            if (num % i === 0) {
                return false;
            }
        }
        return true;
    }

    // 质数计算函数
    for (let num = start; num <= end; num++) {
        if (isPrime(num)) {
            count++;
        }
        // 每处理1000个数字报告一次进度
        if (num % 1000 === 0) {
            self.postMessage({
                type: 'progress',
                current: num,
                end: end
            });
        }
    }
    
    // 发送最终结果
    self.postMessage({
        type: 'result',
        count: count
    });
}, false);
