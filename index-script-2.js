
  var baacPopupOnOk = null;

  function showBaacPopup(title, message, type, onOk) {
    var backdrop = document.getElementById('baacPopupBackdrop');
    var card = document.getElementById('baacPopupCard');
    var icon = document.getElementById('baacPopupIcon');
    var titleEl = document.getElementById('baacPopupTitle');
    var messageEl = document.getElementById('baacPopupMessage');
    var okBtn = document.getElementById('baacPopupOk');

    type = type || 'warning';
    baacPopupOnOk = (typeof onOk === 'function') ? onOk : null;

    card.className = 'baac-popup-card ' + type;

    if (type === 'success') icon.textContent = '✓';
    else if (type === 'error') icon.textContent = '×';
    else icon.textContent = '!';

    titleEl.textContent = title || 'แจ้งเตือน';
    messageEl.textContent = message || '';

    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden', 'false');

    setTimeout(function() {
      okBtn.focus();
    }, 30);

    okBtn.onclick = function() {
      var callback = baacPopupOnOk;
      hideBaacPopup();
      if (typeof callback === 'function') {
        callback();
      }
    };

    backdrop.onclick = function(e) {
      if (e.target === backdrop && !baacPopupOnOk) {
        hideBaacPopup();
      }
    };
  }

  function hideBaacPopup() {
    var backdrop = document.getElementById('baacPopupBackdrop');
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden', 'true');
    baacPopupOnOk = null;
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var backdrop = document.getElementById('baacPopupBackdrop');
      if (
        backdrop &&
        backdrop.classList.contains('show') &&
        !baacPopupOnOk
      ) {
        hideBaacPopup();
      }
    }
  });