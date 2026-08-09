function confirmDelete(productId) {

    const confirmationModal = new bootstrap.Modal(
      document.getElementById("confirmationModal"),
      {
        backdrop: "static", 
        keyboard: false, 
      }
    );
  
    confirmationModal.show();
  

    const deleteButton = document.getElementById("deleteButton");
  
    deleteButton.addEventListener("click", () => {
    
      fetch(/admin/delete-product?id=$:{productId}, {
        method: "DELETE", 
        headers: {
          "Content-Type": "application/json",

        },
      })
        .then((response) => {
          console.log(response);
  

          confirmationModal.hide();
          window.location.reload();
        })
        .catch((error) => {

          console.error("Error deleting product:", error);
        });
    });
  }