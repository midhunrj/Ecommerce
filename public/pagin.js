
function generatePageLink(page) {

    const currentUrl = window.location.href;
    
    const separator = currentUrl.includes('?') ? '&' : '?';
    

    return `${currentUrl}${separator}page=${page}`;
}
