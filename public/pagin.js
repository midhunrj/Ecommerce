// JavaScript function to generate pagination link with current query parameters
function generatePageLink(page) {
    // Get the current URL
    const currentUrl = window.location.href;
    
    // Check if the current URL already contains query parameters
    const separator = currentUrl.includes('?') ? '&' : '?';
    
    // Construct the new URL with the page query parameter
    return `${currentUrl}${separator}page=${page}`;
}
