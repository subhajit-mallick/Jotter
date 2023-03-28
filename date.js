module.exports.day = () => {
    const today = new Date();
    let options = { weekday: 'long', day: 'numeric', month: 'long' }
    const day = today.toLocaleDateString('en-US', options);

    return day;
}