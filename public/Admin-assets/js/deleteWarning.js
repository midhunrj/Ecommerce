function confirmDelete(productId) {
    // Set up a Bootstrap modal for confirmation
    const confirmationModal = new bootstrap.Modal(
      document.getElementById("confirmationModal"),
      {
        backdrop: "static", // Prevent closing on click outside the modal
        keyboard: false, // Prevent closing with the keyboard Esc key
      }
    );
  
    // Display the modal
    confirmationModal.show();
  
    // Update the delete button's event listener to handle the fetch request
    const deleteButton = document.getElementById("deleteButton");
  
    deleteButton.addEventListener("click", () => {
      // Fetch request to delete the product
      fetch(/admin/delete-product?id=$:{productId}, {
        method: "DELETE", // Specify the DELETE HTTP method
        headers: {
          "Content-Type": "application/json",
          // Add any additional headers if needed
        },
      })
        .then((response) => {
          console.log(response);
  
          // Handle the response, e.g., close the modal or show a success message
          confirmationModal.hide();
          window.location.reload();
        })
        .catch((error) => {
          // Handle errors, e.g., display an error message
          console.error("Error deleting product:", error);
        });
    });
  }