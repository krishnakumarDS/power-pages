(function ($) {
  var HIDDEN_LABELS = ["user", "user1", "review comments"];
  var DEFAULT_STATUS_LABEL = "status";
  var DEFAULT_STATUS_VALUE_TEXT = "open";

  function labelText($group) {
    var $label = $group.find("label").first();
    return $.trim($label.text()).replace(/\*$/, "").trim().toLowerCase();
  }

  function cleanUpForm() {
    var $groups = $(".form-group, .form-horizontal .control-group");
    if (!$groups.length) return false;

    $groups.each(function () {
      var $group = $(this);
      if ($group.data("dewaProcessed")) return;
      var text = labelText($group);
      if (!text) return;

      if (HIDDEN_LABELS.indexOf(text) !== -1) {
        $group.addClass("dewa-hidden-field");
        $group.data("dewaProcessed", true);
        return;
      }

      if (text === DEFAULT_STATUS_LABEL) {
        var $select = $group.find("select").first();
        if ($select.length) {
          $select.find("option").each(function () {
            if ($.trim($(this).text()).toLowerCase() === DEFAULT_STATUS_VALUE_TEXT) {
              $select.val($(this).val());
            }
          });
        }
        $group.addClass("dewa-hidden-field");
        $group.data("dewaProcessed", true);
      }
    });
    return true;
  }

  $(function () {
    cleanUpForm();
    var $host = $(".entityform, form.entityform, .dewa-app-page").first();
    if ($host.length && window.MutationObserver) {
      var observer = new MutationObserver(function () {
        cleanUpForm();
      });
      observer.observe($host[0], { childList: true, subtree: true });
    }
  });
})(jQuery);
