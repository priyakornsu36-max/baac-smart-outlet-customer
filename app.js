(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbzha4xvn3ha9ek0VweZYFubQrJ6-_Qeb3G2PHMWGHv5Tej6YCMjUzQMEmq6FWdeTQfo/exec';
  const API_TIMEOUT_MS = 30000;
  const POST_ACTIONS = new Set([
    'updateMemberPhotoData',
    'markConsignorPaymentNotificationRead'
  ]);
  let callbackSeq = 0;

  function callApiJsonp(action, args) {
    return new Promise((resolve, reject) => {
      const callbackName = '__baacCustomerPwaCb_' + Date.now() + '_' + (++callbackSeq);
      const script = document.createElement('script');
      let finished = false;
      let timer = null;

      const cleanup = () => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      };

      window[callbackName] = (result) => {
        cleanup();
        resolve(result);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('ไม่สามารถเชื่อมต่อ BAAC SMART OUTLET ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่'));
      };

      const params = new URLSearchParams({
        page: 'api',
        action: String(action || ''),
        args: JSON.stringify(Array.isArray(args) ? args : []),
        callback: callbackName,
        _: String(Date.now())
      });

      script.src = API_URL + '?' + params.toString();
      script.async = true;

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่'));
      }, API_TIMEOUT_MS);

      document.head.appendChild(script);
    });
  }

  function callApiPost(action, args) {
    return new Promise((resolve, reject) => {
      const token = 'baac_' + Date.now() + '_' + (++callbackSeq) + '_' + Math.random().toString(36).slice(2);
      const frameName = '__baacCustomerPwaFrame_' + Date.now() + '_' + callbackSeq;
      const iframe = document.createElement('iframe');
      const form = document.createElement('form');
      let finished = false;
      let timer = null;

      iframe.name = frameName;
      iframe.style.display = 'none';
      iframe.setAttribute('aria-hidden', 'true');

      form.method = 'POST';
      form.action = API_URL;
      form.target = frameName;
      form.style.display = 'none';

      const fields = {
        page: 'api',
        action: String(action || ''),
        args: JSON.stringify(Array.isArray(args) ? args : []),
        token
      };

      Object.keys(fields).forEach((name) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = fields[name];
        form.appendChild(input);
      });

      const cleanup = () => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        if (form.parentNode) form.parentNode.removeChild(form);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };

      const onMessage = (event) => {
        const data = event && event.data;
        if (!data || data.baacCustomerPwa !== true || data.token !== token) return;
        cleanup();
        if (data.ok) resolve(data.result);
        else reject(new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ'));
      };

      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);
      document.body.appendChild(form);

      timer = setTimeout(() => {
        cleanup();
        reject(new Error('การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่'));
      }, API_TIMEOUT_MS);

      form.submit();
    });
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function verifyRegisteredMember(data) {
    const phone = String((data && data.phone) || '').replace(/\D/g, '').trim();
    if (phone.length !== 10) return null;

    try {
      const check = await callApiJsonp('loginCustomer', [phone]);
      if (check && check.success && check.memberId) {
        return {
          success: true,
          memberId: check.memberId,
          memberName:
            (String(data.firstName || '').trim() + ' ' +
             String(data.lastName || '').trim()).trim(),
          phone: phone,
          message: 'สมัครสมาชิกเรียบร้อย'
        };
      }
    } catch (_) {}

    return null;
  }

  async function registerCustomerFast(args) {
    const data = args && args[0] ? args[0] : {};
    const phone = String(data.phone || '').replace(/\D/g, '').trim();

    if (phone.length !== 10) {
      return callApiJsonp('registerCustomerMember', args);
    }

    // ตรวจสมาชิกเดิมก่อน เพื่อหลีกเลี่ยงการสมัครซ้ำ
    try {
      const existing = await callApiJsonp('loginCustomer', [phone]);
      if (existing && existing.success && existing.memberId) {
        return {
          success: false,
          alreadyMember: true,
          memberId: existing.memberId,
          message: 'เบอร์โทรศัพท์นี้เป็นสมาชิกอยู่แล้ว กรุณาเข้าสู่ระบบ'
        };
      }
    } catch (_) {}

    // ข้อมูลสมัครมีขนาดเล็ก ใช้ JSONP โดยตรงแทน iframe POST
    // เพื่อให้ iPhone/Safari รับผลตอบกลับจาก Apps Script ได้แน่นอนกว่า
    return callApiJsonp('registerCustomerMember', args);
  }

  async function verifyMemberPhoto(memberId, photoDataUrl) {
    memberId = String(memberId || '').trim();
    photoDataUrl = String(photoDataUrl || '').trim();

    if (!memberId || !photoDataUrl) return null;

    try {
      const check = await callApiJsonp('getMemberData', [memberId]);
      const savedPhoto = String(
        check && check.member && check.member.photoUrl
          ? check.member.photoUrl
          : ''
      ).trim();

      if (
        check &&
        check.success &&
        savedPhoto &&
        savedPhoto === photoDataUrl
      ) {
        return {
          success: true,
          photoUrl: savedPhoto,
          message: 'บันทึกรูปสมาชิกเรียบร้อย'
        };
      }
    } catch (_) {}

    return null;
  }

  async function updateMemberPhotoFast(args) {
    const memberId = String(args && args[0] ? args[0] : '').trim();
    const photoDataUrl = String(args && args[1] ? args[1] : '').trim();

    if (!memberId || !photoDataUrl) {
      return callApiPost('updateMemberPhotoData', args);
    }

    let postDone = false;
    let postResult = null;
    let postError = null;

    callApiPost('updateMemberPhotoData', args)
      .then((result) => {
        postDone = true;
        postResult = result;
      })
      .catch((error) => {
        postDone = true;
        postError = error;
      });

    // iPhone/Safari may lose Apps Script postMessage even when Sheets was saved.
    // Verify the saved image directly instead of waiting 30 seconds for a false timeout.
    const delays = [900, 1300, 1800, 2400];

    for (const delay of delays) {
      await wait(delay);

      if (postResult) {
        return postResult;
      }

      const verified =
        await verifyMemberPhoto(memberId, photoDataUrl);

      if (verified) {
        return verified;
      }
    }

    // One final verification before reporting a real error.
    const verified =
      await verifyMemberPhoto(memberId, photoDataUrl);

    if (verified) {
      return verified;
    }

    throw postError || new Error(
      'ยังไม่สามารถยืนยันการบันทึกรูปได้ กรุณาลองอีกครั้ง'
    );
  }

  function callApi(action, args) {
    const normalizedArgs = Array.isArray(args) ? args : [];
    const argText = JSON.stringify(normalizedArgs);
    action = String(action || '');

    if (action === 'registerCustomerMember') {
      return registerCustomerFast(normalizedArgs);
    }

    if (action === 'updateMemberPhotoData') {
      return updateMemberPhotoFast(normalizedArgs);
    }

    if (POST_ACTIONS.has(action) || argText.length > 1500) {
      return callApiPost(action, normalizedArgs);
    }

    return callApiJsonp(action, normalizedArgs);
  }

  // Compatibility layer: existing CUSTOMER pages can keep using
  // google.script.run.withSuccessHandler(...).withFailureHandler(...).method(...)
  function createRunner() {
    let successHandler = null;
    let failureHandler = null;
    let proxy;

    proxy = new Proxy({}, {
      get(_obj, prop) {
        if (prop === 'withSuccessHandler') {
          return (fn) => { successHandler = typeof fn === 'function' ? fn : null; return proxy; };
        }
        if (prop === 'withFailureHandler') {
          return (fn) => { failureHandler = typeof fn === 'function' ? fn : null; return proxy; };
        }
        if (prop === 'then') return undefined;
        if (typeof prop === 'symbol') return undefined;

        return (...args) => {
          const onSuccess = successHandler;
          const onFailure = failureHandler;
          successHandler = null;
          failureHandler = null;

          callApi(String(prop), args)
            .then((result) => {
              if (typeof onSuccess === 'function') onSuccess(result);
            })
            .catch((error) => {
              if (typeof onFailure === 'function') onFailure(error);
              else console.error(error);
            });
        };
      }
    });
    return proxy;
  }

  window.BAAC_CUSTOMER_API_URL = API_URL;
  window.baacCustomerApi = callApi;
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = createRunner();

  // Start warming Apps Script as soon as app.js loads.
  // By the time the customer finishes typing a phone number,
  // the backend is usually already warm.
  window.__baacWarmupPromise = null;
  if (/(?:\/|\/index\.html)$/.test(window.location.pathname)) {
    window.__baacWarmupPromise =
      callApiJsonp('warmup', []).catch(() => null);
  }


  // Pull-to-refresh for CUSTOMER PWA (iPhone/iPad standalone included).
  // Starts only when the page is already at the very top.
  function installPullToRefresh() {
    if (window.__baacPullToRefreshInstalled) return;
    window.__baacPullToRefreshInstalled = true;

    let startY = 0;
    let pulling = false;
    let distance = 0;
    const threshold = 78;

    const indicator = document.createElement('div');
    indicator.setAttribute('aria-hidden', 'true');
    indicator.style.cssText =
      'position:fixed;left:50%;top:10px;z-index:2147483647;' +
      'transform:translate(-50%,-70px);opacity:0;' +
      'padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.96);' +
      'color:#0d6f40;font:700 13px "FC Subject Rounded",sans-serif;' +
      'box-shadow:0 5px 18px rgba(0,0,0,.14);pointer-events:none;' +
      'transition:transform .16s ease,opacity .16s ease;';
    indicator.textContent = '↓ ดึงลงเพื่อรีเฟรช';
    document.body.appendChild(indicator);

    function atTop() {
      return (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0) <= 0;
    }

    document.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1 || !atTop()) {
        pulling = false;
        return;
      }
      startY = event.touches[0].clientY;
      distance = 0;
      pulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', function (event) {
      if (!pulling || !event.touches || event.touches.length !== 1) return;

      distance = event.touches[0].clientY - startY;
      if (distance <= 0 || !atTop()) {
        pulling = false;
        indicator.style.transform = 'translate(-50%,-70px)';
        indicator.style.opacity = '0';
        return;
      }

      const shown = Math.min(distance * 0.45, 58);
      indicator.style.transform = 'translate(-50%,' + (shown - 48) + 'px)';
      indicator.style.opacity = String(Math.min(distance / 45, 1));
      indicator.textContent =
        distance >= threshold ? '↻ ปล่อยเพื่อรีเฟรช' : '↓ ดึงลงเพื่อรีเฟรช';
    }, { passive: true });

    function finishPull() {
      if (!pulling) return;
      const shouldRefresh = distance >= threshold && atTop();
      pulling = false;

      if (shouldRefresh) {
        indicator.textContent = '↻ กำลังรีเฟรช...';
        indicator.style.transform = 'translate(-50%,0)';
        indicator.style.opacity = '1';
        window.setTimeout(function () {
          window.location.reload();
        }, 120);
        return;
      }

      indicator.style.transform = 'translate(-50%,-70px)';
      indicator.style.opacity = '0';
    }

    document.addEventListener('touchend', finishPull, { passive: true });
    document.addEventListener('touchcancel', finishPull, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPullToRefresh);
  } else {
    installPullToRefresh();
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((error) => {
        console.warn('Service worker registration failed', error);
      });
    });
  }
})();