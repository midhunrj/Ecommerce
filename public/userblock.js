function updateUserStatus(userId) {
    console.log(userId);
  
    $.ajax({
      url:`/admin/users/${userId}/block`,
      type: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ is_blocked: 1 }),
      success: function () {
        console.log("User blocked successfully");
        location.reload();
      },
      error: function (xhr, status, error) {
        console.error("Failed to block user", error);
      },
    });
  }