  let consignorId = '';

  function normalizeConsignorId(value){
    return String(value || '').trim();
  }

  function saveConsignorSession(id, phone){
    id = normalizeConsignorId(id);
    phone = String(phone || '').replace(/\D/g, '').trim();

    try {
      if(id) localStorage.setItem('baacConsignorId', id);
      if(phone) localStorage.setItem('baacConsignorPhone', phone);
      if(id) localStorage.setItem('baacActiveRole', 'consignor');
    } catch (e) {}

    try {
      if(id) sessionStorage.setItem('baacConsignorId', id);
      if(phone) sessionStorage.setItem('baacConsignorPhone', phone);
    } catch (e) {}
  }

  function resolveConsignorId(){
    let id = '';

    // 1) query string
    try{
      const params = new URLSearchParams(window.location.search);
      id = normalizeConsignorId(params.get('consignorId'));
    }catch(e){}

    // 2) hash fallback
    if(!id){
      try{
        const hash = String(window.location.hash || '').replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);
        id = normalizeConsignorId(
          hashParams.get('consignor') ||
          hashParams.get('consignorId')
        );
      }catch(e){}
    }

    // 3) sessionStorage
    if(!id){
      try{
        id = normalizeConsignorId(
          sessionStorage.getItem('baacConsignorId')
        );
      }catch(e){}
    }

    // 4) localStorage
    if(!id){
      try{
        id = normalizeConsignorId(
          localStorage.getItem('baacConsignorId')
        );
      }catch(e){}
    }

    if(id){
      consignorId = id;
      saveConsignorSession(id, '');
    }

    return id;
  }

  function resolveConsignorPhone(){
    let phone = '';

    try{
      phone = String(
        sessionStorage.getItem('baacConsignorPhone') || ''
      ).replace(/\D/g, '').trim();
    }catch(e){}

    if(!phone){
      try{
        phone = String(
          localStorage.getItem('baacConsignorPhone') || ''
        ).replace(/\D/g, '').trim();
      }catch(e){}
    }

    return phone;
  }

  resolveConsignorId();

  let pageData = null;


  /* ========================================================
     FORMAT
  ======================================================== */

  function formatMoney(value){

    return Number(
      value || 0
    ).toLocaleString(
      'th-TH',
      {
        minimumFractionDigits:0,
        maximumFractionDigits:2
      }
    );
  }


  function escapeHtml(value){

    return String(
      value == null
        ? ''
        : value
    )
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }


  function drivePreviewUrl(value){

    const url = String(
      value == null
        ? ''
        : value
    ).trim();

    if(!url){
      return '';
    }

    let match =
      url.match(/\/d\/([^/?#]+)/);

    if(!match){
      match =
        url.match(/[?&]id=([^&#]+)/);
    }

    if(!match){
      return url;
    }

    return (
      'https://drive.google.com/thumbnail?id=' +
      encodeURIComponent(match[1]) +
      '&sz=w1600'
    );
  }


  function normalizePaymentProofUrls(value){

    if(Array.isArray(value)){

      return value
        .map(function(v){
          return String(v || '').trim();
        })
        .filter(Boolean);
    }

    const raw =
      String(value || '').trim();

    if(!raw){
      return [];
    }

    if(raw.charAt(0) === '['){

      try{

        const parsed =
          JSON.parse(raw);

        if(Array.isArray(parsed)){

          return parsed
            .map(function(v){
              return String(v || '').trim();
            })
            .filter(Boolean);
        }

      }catch(error){}
    }

    return raw
      .split(/\r?\n/)
      .map(function(v){
        return v.trim();
      })
      .filter(Boolean);
  }


  function paymentProofHtml(item){

    const urls =
      normalizePaymentProofUrls(
        item &&
        Array.isArray(item.proofUrls) &&
        item.proofUrls.length
          ? item.proofUrls
          : (
              item &&
              item.proof != null
                ? item.proof
                : ''
            )
      );

    if(!urls.length){
      return '';
    }

    return `
      <div class="proof">

        <div class="proof-images-grid">

          ${urls.map(
            function(original){

              const preview =
                drivePreviewUrl(original);

              return `
                <div class="proof-image-item">

                  <img
                    class="proof-image"
                    src="${escapeHtml(preview)}"
                    alt="หลักฐานการโอนเงิน"
                    title="แตะรูปเพื่อขยาย"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    onclick="openProofLightbox(this.src)"
                    onerror="this.style.display='none';"
                  >

                  <div class="proof-image-label">
                    แตะรูปเพื่อขยาย
                  </div>

                </div>
              `;
            }
          ).join('')}

        </div>

      </div>
    `;
  }


  /* ========================================================
     LOAD
  ======================================================== */

  function loadConsignorData(id){

    google.script.run
      .withSuccessHandler(function(result){

        if(!result || !result.success){
          showError(
            result && result.message
              ? result.message
              : 'ไม่สามารถโหลดข้อมูลได้'
          );
          return;
        }

        pageData = result;
        renderPage(result);
        showNewPaymentNotification();
      })
      .withFailureHandler(function(error){
        console.error(error);
        showError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      })
      .getConsignorData(id);
  }


  function loadConsignor(){

    let id = resolveConsignorId();

    if(id){
      loadConsignorData(id);
      return;
    }

    // ถ้า iPhone/WebView ทำ URL/session ID หลุด ให้กู้ ID จากเบอร์ที่ Login สำเร็จ
    const savedPhone = resolveConsignorPhone();

    if(savedPhone.length === 10){

      document
        .getElementById('app')
        .innerHTML =
          '<div class="loading">กำลังกู้ข้อมูลผู้ฝากขาย...</div>';

      google.script.run
        .withSuccessHandler(function(result){

          if(!result || !result.success || !result.consignorId){
            showError('ไม่พบรหัสผู้ฝากขาย กรุณาเข้าสู่ระบบใหม่');
            return;
          }

          id = normalizeConsignorId(result.consignorId);
          consignorId = id;
          saveConsignorSession(id, savedPhone);

          // อัปเดต URL โดยไม่ reload เพื่อให้ state ชัดเจน
          try{
            history.replaceState(
              null,
              '',
              './consignor.html?consignorId=' +
                encodeURIComponent(id) +
                '#consignor=' +
                encodeURIComponent(id)
            );
          }catch(e){}

          loadConsignorData(id);
        })
        .withFailureHandler(function(error){
          console.error(error);
          showError('ไม่พบรหัสผู้ฝากขาย กรุณาเข้าสู่ระบบใหม่');
        })
        .loginConsignor(savedPhone);

      return;
    }

    showError(
      'ไม่พบรหัสผู้ฝากขาย กรุณาเข้าสู่ระบบใหม่'
    );
  }

  /* ========================================================
     PAGE
  ======================================================== */

  function renderPage(data){

    const c =
      data.consignor || {};

    const s =
      data.summary || {};

    const products =
      data.products || [];

    const bestSeller =
      data.bestSeller || {};


    document
      .getElementById('app')
      .innerHTML = `


        <section class="profile-card">

          <div class="profile-heading">

            <div class="profile-best">
              ${renderBestSeller(bestSeller)}
            </div>

            <div class="profile-title">
              ข้อมูลผู้ฝากขาย
            </div>

          </div>


          <div class="profile-grid">

            <div class="seller-details">

              <div class="detail-row">

                <div class="detail-label">
                  ชื่อผู้ฝากขาย
                </div>

                <div class="detail-value">
                  ${escapeHtml(c.name || '-')}
                </div>

              </div>


              <div class="detail-row">

                <div class="detail-label">
                  รหัสผู้ฝากขาย
                </div>

                <div class="detail-value">
                  ${escapeHtml(c.consignorId || '-')}
                </div>

              </div>


              <div class="detail-row">

                <div class="detail-label">
                  เบอร์โทรศัพท์
                </div>

                <div class="detail-value">
                  ${escapeHtml(c.phone || '-')}
                </div>

              </div>


              <div class="detail-row">

                <div class="detail-label">
                  ธนาคาร
                </div>

                <div class="detail-value">
                  ${escapeHtml(c.bank || '-')}
                  ${c.branch ? ` สาขา ${escapeHtml(c.branch)}` : ''}
                </div>

              </div>


              <div class="detail-row">

                <div class="detail-label">
                  เลขบัญชีรับเงิน
                </div>

                <div class="detail-value">
                  ${escapeHtml(c.bankAccount || '-')}
                </div>

              </div>

            </div>


            <div class="profile-avatar-side">

              <div class="avatar-wrap">

                <div class="avatar" aria-label="รูปผู้ฝากขาย"></div>

                <span class="online-dot">✓</span>

              </div>

              <div class="avatar-caption">
                ผู้ฝากขาย
              </div>

            </div>

          </div>

        </section>


        <section class="section">

          <div class="section-head">

            <div>

              <div class="section-kicker">
                MY PRODUCTS
              </div>

              <div class="section-title">
                สินค้าของฉัน
              </div>

            </div>

          </div>


          <div class="products-grid">

            ${renderProducts(
              products
            )}

          </div>

        </section>


        <section class="section">

          <div class="section-head">

            <div>

              <div class="section-kicker">
                PAYMENT STATUS
              </div>

              <div class="section-title">
                การรับเงิน
              </div>

            </div>

          </div>


          <div class="money-actions">


            <div
              class="action-card paid"
              onclick="openPaid()"
            >

              <div class="action-top">

                <div class="action-icon">
                  ✓
                </div>

                <div class="arrow">
                  ›
                </div>

              </div>


              <div class="action-label">
                จ่ายแล้ว
              </div>

              <div class="action-value">
                ฿${formatMoney(
                  s.paidTotal
                )}
              </div>

              <div class="action-desc">
                ดูวันที่โอน ช่องทางการโอน
                และหลักฐานการจ่ายเงิน
              </div>

            </div>


            <div
              class="action-card waiting"
              onclick="openWaiting()"
            >

              <div class="action-top">

                <div class="action-icon">
                  ◷
                </div>

                <div class="arrow">
                  ›
                </div>

              </div>


              <div class="action-label">
                รอรับเงิน
              </div>

              <div class="action-value">
                ฿${formatMoney(
                  s.waitingAmount
                )}
              </div>

              <div class="action-desc">
                ยอดสินค้าที่ขายแล้ว
                และยังอยู่ระหว่างรอการจ่ายเงิน
              </div>

            </div>


          </div>

        </section>

      `;
  }


  /* ========================================================
     BEST SELLER
  ======================================================== */

  function renderBestSeller(
    bestSeller
  ){

    if(
      !bestSeller ||
      !bestSeller.isCurrent
    ){

      return '';
    }


    return `

      <div class="best-chip">
        🏆 ร้านค้าขายดี
      </div>

    `;
  }


  /* ========================================================
     PRODUCTS
  ======================================================== */

  function renderProducts(
    products
  ){

    if(
      !products.length
    ){

      return `

        <div class="empty">
          ยังไม่มีสินค้าในร้านของคุณ
        </div>

      `;
    }


    return products
      .map(
        function(item){

          const received =
            Number(
              item.received || 0
            );

          const sold =
            Number(
              item.sold || 0
            );

          const stock =
            Number(
              item.stock || 0
            );


          let image = `

            <div class="product-placeholder">
              📦
            </div>

          `;


          if(
            item.imageUrl
          ){

            image = `

              <img
                src="${escapeHtml(
                  item.imageUrl
                )}"

                alt="${escapeHtml(
                  item.productName
                )}"

                onerror="
                  this.style.display='none';
                  this.nextElementSibling.style.display='block';
                "
              >

              <div
                class="product-placeholder"
                style="display:none"
              >
                📦
              </div>

            `;
          }


          return `

            <article class="product-card">


              <div class="product-photo">

                ${image}

              </div>


              <div class="product-content">

                <div class="product-title">
                  ${escapeHtml(
                    item.productName
                  )}
                </div>


                <div class="stats">


                  <div class="stat">

                    <div class="stat-label">
                      ทั้งหมด
                    </div>

                    <div class="stat-value">
                      ${formatMoney(
                        received
                      )}
                    </div>

                  </div>


                  <div class="stat sold">

                    <div class="stat-label">
                      ขายแล้ว
                    </div>

                    <div class="stat-value">
                      ${formatMoney(
                        sold
                      )}
                    </div>

                  </div>


                  <div class="stat stock">

                    <div class="stat-label">
                      คงเหลือ
                    </div>

                    <div class="stat-value">
                      ${formatMoney(
                        stock
                      )}
                    </div>

                  </div>


                </div>


                <div class="status-line ${stock <= 0 ? 'status-out' : 'status-in'}">

                  <span class="status-dot"></span>

                  ${stock <= 0 ? 'สินค้าหมด' : 'มีสินค้า'}

                </div>


              </div>

            </article>

          `;
        }
      )
      .join('');
  }


  /* ========================================================
     PAID
  ======================================================== */