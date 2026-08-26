const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomHex = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
    return `SB-${timestamp}-${randomHex}`;
};

module.exports = generateOrderId;
