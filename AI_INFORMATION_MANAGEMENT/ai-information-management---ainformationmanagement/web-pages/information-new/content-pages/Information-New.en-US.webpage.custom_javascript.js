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
  function escapeHtml(str) {
    return $("<div>").text(str == null ? "" : str).html();
  }

  function showAlert(type, message) {
    var $slot = $("#dewa-alert-slot");
    $slot.html('<div class="dewa-alert dewa-alert-' + type + '">' + escapeHtml(message) + "</div>");
  }

  function submitNew() {
    var title = $.trim($("#dewa-new-title").val());
    var category = $.trim($("#dewa-new-category").val());
    var description = $.trim($("#dewa-new-description").val());
    if (!title || !description) {
      showAlert("error", "Title and description are required.");
      return;
    }
    var payload = {
      new_title: title,
      new_category: category,
      new_description: description,
      new_status: 100000000
    };
    var $btn = $("#dewa-new-submit").prop("disabled", true).text("Submitting...");
    webapi.safeAjax({ type: "POST", url: "/_api/new_ai_informations", contentType: "application/json", data: JSON.stringify(payload) })
      .done(function () {
        window.location.href = "/information";
      })
      .fail(function (xhr) {
        showAlert("error", "Couldn't submit this record. " + (xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error.message : ""));
        $btn.prop("disabled", false).text("Submit");
      });
  }

  $(function () {
    $("#dewa-new-submit").on("click", submitNew);
  });
})(jQuery);
