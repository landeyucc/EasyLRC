/**
 * 时间处理模块：负责时间格式化、时间计算等功能
 */
const timeHandler = (() => {
    // 格式化时间（秒 -> mm:ss.ms）
    const formatTime = (seconds) => {
        if (isNaN(seconds) || seconds === null || seconds === undefined || seconds < 0) return '00:00.00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds - Math.floor(seconds)) * 100);
        
        return `${padZero(mins)}:${padZero(secs)}.${padZero(ms, 2)}`;
    };
    
    // 数字补零
    const padZero = (num, length = 2) => {
        return num.toString().padStart(length, '0');
    };
    
    // 解析LRC时间格式（mm:ss:ms 或 mm:ss.ms -> 秒）
    const parseTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return null;
        
        // 支持 mm:ss:ms 或 mm:ss.ms 格式
        const parts = timeStr.replace('.', ':').split(':');
        if (parts.length !== 3) return null;
        
        const mins = parseInt(parts[0], 10);
        const secs = parseInt(parts[1], 10);
        const ms = parseInt(parts[2], 10);
        
        if (isNaN(mins) || isNaN(secs) || isNaN(ms)) return null;
        if (mins < 0 || secs < 0 || secs > 59 || ms < 0 || ms > 99) return null;
        
        const result = mins * 60 + secs + ms / 100;
        if (result < 0 || isNaN(result)) return null;
        
        return result;
    };
    
    return {
        formatTime,
        parseTime,
        padZero
    };
})();