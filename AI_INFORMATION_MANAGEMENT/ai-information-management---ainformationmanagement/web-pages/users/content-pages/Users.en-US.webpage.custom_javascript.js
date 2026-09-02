(function (webapi, $) {
  function safeAjax(ajaxOptions) {
    var deferredAjax = $.Deferred();
    shell.getTokenDeferred().done(function (token) {
      if (!ajaxOptions.headers) {
        $.extend(ajaxOptions, { headers: { "__RequestVerificationToken": token } });
      } else {
        ajaxOptions.headers["__RequestVerificationToken"] = token;
      }
      $.ajax(ajaxOptions).done(function (data, textStatus, jqXHR) {
        deferredAjax.resolve(data, textStatus, jqXHR);
      }).fail(deferredAjax.reject);
    }).fail(function () {
      deferredAjax.rejectWith(this, arguments);
    });
    return deferredAjax.promise();
  }
  webapi.safeAjax = safeAjax;
})(window.webapi = window.webapi || {}, jQuery);

(function ($) {
  var ROLE_LABEL = { 100000000: "Administrator", 100000001: "Requestor", 100000002: "Reviewer" };
  var ROLE_CHIP = { 100000000: "dewa-chip-administrator", 100000001: "dewa-chip-requestor", 100000002: "dewa-chip-reviewer" };

  function escapeHtml(str) {
    return $("<div>").text(str == null ? "" : str).html();
  }

  function showAlert(type, message) {
    var $slot = $("#dewa-alert-slot");
    $slot.html('<div class="dewa-alert dewa-alert-' + type + '">' + escapeHtml(message) + "</div>");
    setTimeout(function () { $slot.empty(); }, 5000);
  }

  function renderRows(users) {
    var $tbody = $("#dewa-users-tbody");
    if (!users.length) {
      $tbody.html('<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--dewa-text-secondary);">No users yet. Click "New User" to add one.</td></tr>');
      return;
    }
    var rows = users.map(function (u) {
      var roleLabel = ROLE_LABEL[u.new_role] || "—";
      var roleChip = ROLE_CHIP[u.new_role] || "";
      var active = (u.new_active || "").toLowerCase() === "active";
      return (
        "<tr>" +
        "<td>" + escapeHtml(u.new_name) + "</td>" +
        "<td>" + escapeHtml(u.new_email) + "</td>" +
        '<td><span class="dewa-chip ' + roleChip + '">' + roleLabel + "</span></td>" +
        '<td><span class="dewa-chip ' + (active ? "dewa-chip-active" : "dewa-chip-inactive") + '">' + escapeHtml(u.new_active || "Inactive") + "</span></td>" +
        '<td class="dewa-table-actions">' +
        '<button type="button" class="dewa-edit-btn" data-id="' + u.new_data_signinid + '" title="Edit">&#9998;</button>' +
        '<button type="button" class="dewa-delete-btn danger" data-id="' + u.new_data_signinid + '" data-name="' + escapeHtml(u.new_name) + '" title="Delete">&#128465;</button>' +
        "</td>" +
        "</tr>"
      );
    });
    $tbody.html(rows.join(""));
  }

  function loadUsers() {
    $("#dewa-users-tbody").html('<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--dewa-text-secondary);">Loading...</td></tr>');
    $.ajax({
      type: "GET",
      url: "/_api/new_data_signins?$select=new_name,new_email,new_role,new_active&$orderby=new_name asc",
      headers: { Accept: "application/json" }
    }).done(function (res) {
      renderRows(res.value || []);
    }).fail(function () {
      $("#dewa-users-tbody").html('<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--dewa-error);">Couldn\'t load users. Please refresh the page.</td></tr>');
    });
  }

  function openPanel(record) {
    $("#dewa-user-id").val(record ? record.new_data_signinid : "");
    $("#dewa-user-name").val(record ? record.new_name : "");
    $("#dewa-user-email").val(record ? record.new_email : "");
    $("#dewa-user-role").val(record ? record.new_role : "100000001");
    $("#dewa-user-active").val(record && record.new_active ? record.new_active : "Active");
    $("#dewa-panel-title").text(record ? "Edit User" : "New User");
    $("#dewa-panel-backdrop, #dewa-user-panel").addClass("open");
  }

  function closePanel() {
    $("#dewa-panel-backdrop, #dewa-user-panel").removeClass("open");
  }

  function saveUser() {
    var id = $("#dewa-user-id").val();
    var name = $.trim($("#dewa-user-name").val());
    var email = $.trim($("#dewa-user-email").val());
    if (!name || !email) {
      showAlert("error", "Full name and email are required.");
      return;
    }
    var payload = {
      new_name: name,
      new_email: email,
      new_role: parseInt($("#dewa-user-role").val(), 10),
      new_active: $("#dewa-user-active").val()
    };
    var $saveBtn = $("#dewa-panel-save").prop("disabled", true);

    var request = id
      ? webapi.safeAjax({ type: "PATCH", url: "/_api/new_data_signins(" + id + ")", contentType: "application/json", data: JSON.stringify(payload) })
      : webapi.safeAjax({ type: "POST", url: "/_api/new_data_signins", contentType: "application/json", data: JSON.stringify(payload) });

    request.done(function () {
      showAlert("success", id ? "User updated." : "User created.");
      closePanel();
      loadUsers();
    }).fail(function (xhr) {
      showAlert("error", "Couldn't save this user. " + (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error.message : ""));
    }).always(function () {
      $saveBtn.prop("disabled", false);
    });
  }

  function deleteUser(id, name) {
    if (!window.confirm('Delete user "' + name + '"? This cannot be undone.')) return;
    webapi.safeAjax({ type: "DELETE", url: "/_api/new_data_signins(" + id + ")" })
      .done(function () {
        showAlert("success", "User deleted.");
        loadUsers();
      })
      .fail(function () {
        showAlert("error", "Couldn't delete this user.");
      });
  }

  $(function () {
    if (!$("#dewa-users-tbody").length) return;
    loadUsers();
    $("#dewa-new-user-btn").on("click", function () { openPanel(null); });
    $("#dewa-panel-close, #dewa-panel-cancel, #dewa-panel-backdrop").on("click", closePanel);
    $("#dewa-panel-save").on("click", saveUser);
    $(document).on("click", ".dewa-edit-btn", function () {
      var id = $(this).data("id");
      $.ajax({
        type: "GET",
        url: "/_api/new_data_signins(" + id + ")?$select=new_name,new_email,new_role,new_active",
        headers: { Accept: "application/json" }
      }).done(function (record) { openPanel(record); });
    });
    $(document).on("click", ".dewa-delete-btn", function () {
      deleteUser($(this).data("id"), $(this).data("name"));
    });
  });
})(jQuery);
