(function ($) {
  var STATUS_LABEL = { 100000000: "Open", 100000001: "In Progress", 100000002: "Closed" };
  var STATUS_CHIP = { 100000000: "dewa-chip-open", 100000001: "dewa-chip-inprogress", 100000002: "dewa-chip-closed" };

  function escapeHtml(str) {
    return $("<div>").text(str == null ? "" : str).html();
  }

  function renderRows(items) {
    var $tbody = $("#dewa-info-tbody");
    if (!items.length) {
      $tbody.html('<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--dewa-text-secondary);">No information records found.</td></tr>');
      return;
    }
    var rows = items.map(function (i) {
      var statusLabel = STATUS_LABEL[i.new_status] || "—";
      var statusChip = STATUS_CHIP[i.new_status] || "";
      return (
        "<tr>" +
        "<td>" + escapeHtml(i.new_title) + "</td>" +
        "<td>" + escapeHtml(i.new_category || "—") + "</td>" +
        '<td><span class="dewa-chip ' + statusChip + '">' + statusLabel + "</span></td>" +
        "<td>" + (i.modifiedon ? new Date(i.modifiedon).toLocaleDateString() : "") + "</td>" +
        '<td class="dewa-table-actions">' +
        '<button type="button" class="dewa-view-btn" data-id="' + i.new_ai_informationid + '" title="View">&#128065;</button>' +
        "</td>" +
        "</tr>"
      );
    });
    $tbody.html(rows.join(""));
  }

  function loadInformation() {
    $("#dewa-info-tbody").html('<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--dewa-text-secondary);">Loading...</td></tr>');
    var url = "/_api/new_ai_informations?$select=new_title,new_category,new_status,new_description,modifiedon&$orderby=modifiedon desc";
    $.ajax({ type: "GET", url: url, headers: { Accept: "application/json" } })
      .done(function (res) { renderRows(res.value || []); })
      .fail(function () {
        $("#dewa-info-tbody").html('<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--dewa-error);">Couldn\'t load information records.</td></tr>');
      });
  }

  function openPanel(record) {
    $("#dewa-view-title").text(record.new_title || "");
    $("#dewa-view-category").text(record.new_category || "—");
    $("#dewa-view-status").text(STATUS_LABEL[record.new_status] || "—");
    $("#dewa-view-description").text(record.new_description || "");
    $("#dewa-panel-backdrop, #dewa-info-panel").addClass("open");
  }

  function closePanel() {
    $("#dewa-panel-backdrop, #dewa-info-panel").removeClass("open");
  }

  $(function () {
    if (!$("#dewa-info-tbody").length) return;
    loadInformation();
    $("#dewa-panel-close, #dewa-panel-cancel, #dewa-panel-backdrop").on("click", closePanel);
    $(document).on("click", ".dewa-view-btn", function () {
      var id = $(this).data("id");
      $.ajax({
        type: "GET",
        url: "/_api/new_ai_informations(" + id + ")?$select=new_title,new_category,new_status,new_description",
        headers: { Accept: "application/json" }
      }).done(function (record) { openPanel(record); });
    });
  });
})(jQuery);
