(function ($) {
  var HIDE_COLUMNS = ["user", "user1", "review comments", "description"];
  var STATUS_COLUMN = "status";
  var STATUS_MAP = [
    { match: "closed", cls: "status-closed" },
    { match: "in progress", cls: "status-inprogress" },
    { match: "open", cls: "status-open" }
  ];

  function statusClassFor(text) {
    var lower = text.toLowerCase();
    for (var i = 0; i < STATUS_MAP.length; i++) {
      if (lower.indexOf(STATUS_MAP[i].match) !== -1) return STATUS_MAP[i].cls;
    }
    return "";
  }

  function cleanUpTable($table) {
    if ($table.data("dewaProcessed")) return;
    var $headerCells = $table.find("thead th");
    if (!$headerCells.length) return;

    var hideIndexes = [];
    var statusIndex = -1;
    $headerCells.each(function (index) {
      var text = $.trim($(this).text()).toLowerCase();
      if (HIDE_COLUMNS.indexOf(text) !== -1) hideIndexes.push(index);
      if (text === STATUS_COLUMN) statusIndex = index;
    });

    if (!hideIndexes.length && statusIndex === -1) return;

    $table.find("tr").each(function () {
      var $cells = $(this).children("th, td");
      hideIndexes.forEach(function (idx) {
        $cells.eq(idx).addClass("dewa-hidden-field");
      });
      if (statusIndex !== -1) {
        var $statusCell = $cells.eq(statusIndex);
        if ($statusCell.is("td") && !$statusCell.find(".dewa-status-chip").length) {
          var text = $.trim($statusCell.text());
          if (text) {
            var cls = statusClassFor(text);
            $statusCell.html('<span class="dewa-status-chip ' + cls + '">' + text + "</span>");
          }
        }
      }
    });

    $table.data("dewaProcessed", true);
  }

  function scan() {
    $(".entitylist table, .view-grid table").each(function () {
      cleanUpTable($(this));
    });
  }

  $(function () {
    scan();
    var $host = $(".entitylist, .dewa-app-page").first();
    if ($host.length && window.MutationObserver) {
      var observer = new MutationObserver(function () {
        // A re-render (sort/page/search) replaces the table; reset the
        // processed flag by re-scanning fresh table elements each time.
        scan();
      });
      observer.observe($host[0], { childList: true, subtree: true });
    }
  });
})(jQuery);
