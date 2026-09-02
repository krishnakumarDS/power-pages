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
  var STATUS_LABEL = { 100000000: "Open", 100000001: "In Progress", 100000002: "Closed" };
  var STATUS_CHIP = { 100000000: "dewa-chip-open", 100000001: "dewa-chip-inprogress", 100000002: "dewa-chip-closed" };
  var CATEGORY_LABEL_FALLBACK = function (c) { return c || "—"; };

  function escapeHtml(str) {
    return $("<div>").text(str == null ? "" : str).html();
  }

  function showAlert(type, message) {
    var $slot = $("#dewa-alert-slot");
    $slot.html('<div class="dewa-alert dewa-alert-' + type + '">' + escapeHtml(message) + "</div>");
    setTimeout(function () { $slot.empty(); }, 5000);
  }

  function isReviewer() { return window.DEWA_ROLE === "Reviewer"; }

  function renderRows(items) {
    var $tbody = $("#dewa-info-tbody");
    if (!items.length) {
      $tbody.html('<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--dewa-text-secondary);">No information records found.</td></tr>');
      return;
    }
    var rows = items.map(function (i) {
      var statusLabel = STATUS_LABEL[i.new_status] || "—";
      var statusChip = STATUS_CHIP[i.new_status] || "";
      var closed = i.new_status === 100000002;
      var canEdit = isReviewer() || !closed;
      return (
        "<tr>" +
        "<td>" + escapeHtml(i.new_title) + "</td>" +
        "<td>" + escapeHtml(CATEGORY_LABEL_FALLBACK(i.new_category)) + "</td>" +
        '<td><span class="dewa-chip ' + statusChip + '">' + statusLabel + "</span></td>" +
        "<td>" + escapeHtml(i.new_requesterbyname) + "</td>" +
        "<td>" + (i.modifiedon ? new Date(i.modifiedon).toLocaleDateString() : "") + "</td>" +
        '<td class="dewa-table-actions">' +
        '<button type="button" class="dewa-view-btn" data-id="' + i.new_ai_informationid + '" title="View">&#128065;</button>' +
        '<button type="button" class="dewa-edit-btn" data-id="' + i.new_ai_informationid + '" title="Edit"' + (canEdit ? "" : " disabled") + ">&#9998;</button>" +
        '<button type="button" class="dewa-delete-btn danger" data-id="' + i.new_ai_informationid + '" data-title="' + escapeHtml(i.new_title) + '" title="Delete"' + (canEdit ? "" : " disabled") + ">&#128465;</button>" +
        "</td>" +
        "</tr>"
      );
    });
    $tbody.html(rows.join(""));
  }

  function loadInformation() {
    $("#dewa-info-tbody").html('<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--dewa-text-secondary);">Loading...</td></tr>');
    var select = "$select=new_title,new_category,new_status,new_requesterbyname,new_reviewerbyemail,new_reviewcomments,new_description,modifiedon";
    var url = "/_api/new_ai_informations?" + select + "&$orderby=modifiedon desc";
    if (!isReviewer() && window.DEWA_EMAIL) {
      var safeEmail = window.DEWA_EMAIL.replace(/'/g, "''");
      url += "&$filter=" + encodeURIComponent("new_requesterbyname eq '" + safeEmail + "'");
    }
    $.ajax({ type: "GET", url: url, headers: { Accept: "application/json" } })
      .done(function (res) { renderRows(res.value || []); })
      .fail(function () {
        $("#dewa-info-tbody").html('<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--dewa-error);">Couldn\'t load information records.</td></tr>');
      });
  }

  function openPanel(mode, record) {
    var readOnly = mode === "view";
    $("#dewa-info-id").val(record ? record.new_ai_informationid : "");
    $("#dewa-info-title").val(record ? record.new_title : "").prop("disabled", readOnly);
    $("#dewa-info-category").val(record ? record.new_category : "").prop("disabled", readOnly);
    $("#dewa-info-description").val(record ? record.new_description : "").prop("disabled", readOnly);
    $("#dewa-info-status").val(record ? record.new_status : 100000000).prop("disabled", readOnly);
    $("#dewa-info-comment").val(record ? record.new_reviewcomments : "").prop("disabled", readOnly);
    $("#dewa-info-reviewer-row").toggle(!!(record && record.new_reviewerbyemail));
    $("#dewa-info-reviewer-value").text(record ? record.new_reviewerbyemail : "");
    $("#dewa-panel-title").text(readOnly ? "Record Details" : "Edit Information Record");
    $("#dewa-panel-save").toggle(!readOnly);
    $("#dewa-panel-backdrop, #dewa-info-panel").addClass("open");
  }

  function closePanel() {
    $("#dewa-panel-backdrop, #dewa-info-panel").removeClass("open");
  }

  function saveInfo() {
    var id = $("#dewa-info-id").val();
    var title = $.trim($("#dewa-info-title").val());
    if (!title) { showAlert("error", "Title is required."); return; }
    var payload = {
      new_title: title,
      new_category: $.trim($("#dewa-info-category").val()),
      new_description: $.trim($("#dewa-info-description").val()),
      new_status: parseInt($("#dewa-info-status").val(), 10),
      new_reviewcomments: $.trim($("#dewa-info-comment").val())
    };
    if (isReviewer()) {
      payload.new_reviewerbyemail = window.DEWA_EMAIL || "";
    }
    var $saveBtn = $("#dewa-panel-save").prop("disabled", true);
    webapi.safeAjax({ type: "PATCH", url: "/_api/new_ai_informations(" + id + ")", contentType: "application/json", data: JSON.stringify(payload) })
      .done(function () {
        showAlert("success", "Record updated.");
        closePanel();
        loadInformation();
      })
      .fail(function (xhr) {
        showAlert("error", "Couldn't save this record. " + (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error.message : ""));
      })
      .always(function () { $saveBtn.prop("disabled", false); });
  }

  function deleteInfo(id, title) {
    if (!window.confirm('Delete "' + title + '"? This cannot be undone.')) return;
    webapi.safeAjax({ type: "DELETE", url: "/_api/new_ai_informations(" + id + ")" })
      .done(function () {
        showAlert("success", "Record deleted.");
        loadInformation();
      })
      .fail(function () {
        showAlert("error", "Couldn't delete this record.");
      });
  }

  $(function () {
    if (!$("#dewa-info-tbody").length) return;
    loadInformation();
    $("#dewa-panel-close, #dewa-panel-cancel, #dewa-panel-backdrop").on("click", closePanel);
    $("#dewa-panel-save").on("click", saveInfo);
    $(document).on("click", ".dewa-view-btn, .dewa-edit-btn", function () {
      if ($(this).is(":disabled")) return;
      var id = $(this).data("id");
      var mode = $(this).hasClass("dewa-view-btn") ? "view" : "edit";
      $.ajax({
        type: "GET",
        url: "/_api/new_ai_informations(" + id + ")?$select=new_title,new_category,new_description,new_status,new_reviewcomments,new_reviewerbyemail,new_requesterbyname",
        headers: { Accept: "application/json" }
      }).done(function (record) { openPanel(mode, record); });
    });
    $(document).on("click", ".dewa-delete-btn", function () {
      if ($(this).is(":disabled")) return;
      deleteInfo($(this).data("id"), $(this).data("title"));
    });
  });
})(jQuery);
