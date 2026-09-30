
  function openPaid(){

    if(
      !pageData
    ){
      return;
    }


    const payments =
      (
        pageData.paymentHistory || []
      )
      .filter(
        function(item){

          return (
            item.status === 'โอนแล้ว' ||
            item.status === 'จ่ายแล้ว' ||
            item.status === 'ชำระแล้ว'
          );
        }
      );


    let html = '';


    if(
      !payments.length
    ){

      html = `

        <div class="empty">
          ยังไม่มีรายการจ่ายเงิน
        </div>

      `;

    }else{


      payments.forEach(
        function(item){

          html += `

            <div class="history-card">

              <div class="history-top">

                <div class="history-date">

                  วันที่โอน
                  ${escapeHtml(
                    item.date || '-'
                  )}

                </div>

                <div class="history-money">

                  ฿${formatMoney(
                    item.amount
                  )}

                </div>

              </div>


              <div class="history-desc">

                ช่องทาง:
                ${escapeHtml(
                  item.channel || '-'
                )}

                <br>

                สถานะ:
                ${escapeHtml(
                  item.status || '-'
                )}

              </div>


              ${paymentProofHtml(
                item
              )}

            </div>

          `;
        }
      );
    }


    openModal(
      'จ่ายแล้ว',
      html
    );
  }


  /* ========================================================
     WAITING
  ======================================================== */

  function openWaiting(){

    if(
      !pageData
    ){
      return;
    }


    const summary =
      pageData.summary || {};


    if(
      Number(
        summary.waitingAmount || 0
      ) <= 0
    ){

      openModal(

        'รอรับเงิน',

        `

          <div class="empty">
            ขณะนี้ไม่มียอดรอรับเงิน
          </div>

        `
      );

      return;
    }


    openModal(

      'รอรับเงิน',

      `

        <div class="history-card">

          <div class="history-top">

            <div class="history-date">
              ยอดที่กำลังรอการจ่าย
            </div>

            <div class="history-money">

              ฿${formatMoney(
                summary.waitingAmount
              )}

            </div>

          </div>


          <div class="history-desc">
            สถานะ: รอการโอนเงิน
          </div>


          ${
            pageData.deliveryNotes &&
            pageData.deliveryNotes.length &&
            pageData.deliveryNotes[0].url
              ? `
                <div
                  class="delivery-note-link"
                  onclick="openDeliveryNote(event,'${escapeHtml(
                    pageData.deliveryNotes[0].url
                  )}')"
                >
                  แตะเพื่อดูใบส่งของ
                </div>
              `
              : ''
          }

        </div>

      `
    );
  }



  /* ========================================================
     DELIVERY NOTE
  ======================================================== */

  function openDeliveryNote(event,url){

    if(event){
      event.preventDefault();
      event.stopPropagation();
    }

    const preview =
      drivePreviewUrl(url);

    if(!preview){
      return;
    }

    openProofLightbox(preview);
  }


  /* ========================================================
     PAYMENT NOTIFICATION
     - ไม่แสดงยอดเงิน
     - แสดงเมื่อมีรายการโอนใหม่ที่เครื่องนี้ยังไม่เคยเปิดดู
  ======================================================== */

  function shortThaiPaymentDate(value){

    const raw =
      String(value || '').trim();

    const match =
      raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

    if(!match){
      return raw || '-';
    }

    const dd =
      String(match[1]).padStart(2,'0');

    const mm =
      String(match[2]).padStart(2,'0');

    const yy =
      String(match[3]).slice(-2);

    return dd + '/' + mm + '/' + yy;
  }


  function paidPayments(){

    return (
      pageData &&
      Array.isArray(pageData.paymentHistory)
        ? pageData.paymentHistory
        : []
    ).filter(function(item){

      return (
        item.status === 'โอนแล้ว' ||
        item.status === 'จ่ายแล้ว' ||
        item.status === 'ชำระแล้ว'
      );
    });
  }


  function showNewPaymentNotification(){

    const latest =
      pageData &&
      pageData.paymentNotification
        ? pageData.paymentNotification
        : null;

    if(!latest){
      return;
    }

    const paymentId =
      String(latest.paymentId || '');

    if(!paymentId){
      return;
    }

    const text =
      'การโอนเงินสินค้าฝากขาย Branch Outlet วันที่ ' +
      shortThaiPaymentDate(latest.date);

    const box =
      document.getElementById('paymentNotification');

    const textEl =
      document.getElementById('paymentNotificationText');

    if(!box || !textEl){
      return;
    }

    box.dataset.paymentId = paymentId;
    textEl.textContent = text;
    box.classList.add('show');

    /* แสดงแล้ว = บันทึกทันทีที่ข้อมูลกลาง */
    google.script.run
      .withSuccessHandler(function(){
        if(pageData){
          pageData.paymentNotification = null;
        }
      })
      .withFailureHandler(function(error){
        console.error(
          'mark payment notification failed',
          error
        );
      })
      .markConsignorPaymentNotificationRead(
        consignorId,
        paymentId
      );
  }


  function rememberPaymentNotification(){

    const box =
      document.getElementById('paymentNotification');

    if(box){
      box.classList.remove('show');
    }
  }


  function openPaymentNotification(){

    rememberPaymentNotification();
    openPaid();
  }


  function dismissPaymentNotification(event){

    if(event){
      event.preventDefault();
      event.stopPropagation();
    }

    rememberPaymentNotification();
  }


  /* ========================================================
     IMAGE LIGHTBOX
  ======================================================== */

  function openProofLightbox(src){

    const url =
      String(src || '').trim();

    if(!url){
      return;
    }


    document
      .getElementById(
        'imageLightboxImg'
      )
      .src =
      url;


    document
      .getElementById(
        'imageLightbox'
      )
      .classList
      .add('show');


    document
      .getElementById(
        'imageLightbox'
      )
      .setAttribute(
        'aria-hidden',
        'false'
      );


    document.body.style.overflow =
      'hidden';
  }


  function closeProofLightbox(){

    document
      .getElementById(
        'imageLightbox'
      )
      .classList
      .remove('show');


    document
      .getElementById(
        'imageLightbox'
      )
      .setAttribute(
        'aria-hidden',
        'true'
      );


    document
      .getElementById(
        'imageLightboxImg'
      )
      .removeAttribute(
        'src'
      );


    document.body.style.overflow =
      '';
  }


  document
    .getElementById(
      'imageLightbox'
    )
    .addEventListener(
      'click',
      function(event){

        if(
          event.target === this ||
          event.target ===
            document.getElementById(
              'imageLightboxStage'
            )
        ){

          closeProofLightbox();
        }
      }
    );


  document
    .addEventListener(
      'keydown',
      function(event){

        if(
          event.key === 'Escape' &&
          document
            .getElementById(
              'imageLightbox'
            )
            .classList
            .contains('show')
        ){

          closeProofLightbox();
        }
      }
    );


  /* ========================================================
     MODAL
  ======================================================== */

  function openModal(
    title,
    html
  ){

    document
      .getElementById(
        'modalTitle'
      )
      .textContent =
      title;


    document
      .getElementById(
        'modalContent'
      )
      .innerHTML =
      html;


    document
      .getElementById(
        'detailModal'
      )
      .classList
      .add('show');
  }


  function closeModal(){

    document
      .getElementById(
        'detailModal'
      )
      .classList
      .remove('show');
  }


  document
    .getElementById(
      'detailModal'
    )
    .addEventListener(
      'click',
      function(event){

        if(
          event.target === this
        ){

          closeModal();
        }
      }
    );


  /* ========================================================
     ERROR
  ======================================================== */

  function showError(
    message
  ){

    document
      .getElementById(
        'app'
      )
      .innerHTML = `

        <div class="error">
          ${escapeHtml(
            message
          )}
        </div>

      `;
  }


  /* ========================================================
     LOGOUT
  ======================================================== */

  function logoutConsignor(){

    try{

      localStorage.removeItem('baacConsignorId');
      localStorage.removeItem('baacConsignorPhone');

      try{
        sessionStorage.removeItem('baacConsignorId');
        sessionStorage.removeItem('baacConsignorPhone');
      }catch(e){}

    }catch(e){}


    window.open(
      'index.html',
      '_top'
    );
  }


  /* ========================================================
     START
  ======================================================== */

  loadConsignor();
