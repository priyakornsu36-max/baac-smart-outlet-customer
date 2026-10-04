


  let allProducts = [];

  let salesTotals = {};

  let selectedCategory = 'ทั้งหมด';



  /* ==================================================
     LOAD GOOGLE SHEETS
  ================================================== */


  function loadProducts(){

    google.script.run

      .withSuccessHandler(
        function(result){

          document
            .getElementById('loading')
            .style.display =
              'none';


          if(
            !result ||
            result.success !== true
          ){

            showError(
              result && result.message
                ? result.message
                : 'เกิดข้อผิดพลาด'
            );

            return;

          }


          allProducts =
            Array.isArray(result.products)
              ? result.products
              : [];


          salesTotals =
            result.salesTotals || {};


          renderCategoryFilters();


          document
            .getElementById('content')
            .style.display =
              'block';


          renderAll();

        }
      )


      .withFailureHandler(
        function(error){

          document
            .getElementById('loading')
            .style.display =
              'none';


          showError(
            error && error.message
              ? error.message
              : 'ไม่สามารถเชื่อมต่อข้อมูลได้'
          );

        }
      )


      .getProductsPageData();

  }



  /* ==================================================
     RENDER
  ================================================== */


  function renderAll(){

    renderProducts();

    renderBestSellers();

  }



  /* ==================================================
     PRODUCT FILTER
  ================================================== */


  function getFilteredProducts(){

    return allProducts
      .filter(
        function(product){

          return (
            selectedCategory === 'ทั้งหมด'
            ||
            normalizeCategoryValue(product.category) ===
              normalizeCategoryValue(selectedCategory)
          );

        }
      )
      .sort(
        function(a, b){

          const priceA = Number(a && a.price) || 0;
          const priceB = Number(b && b.price) || 0;

          if(priceA !== priceB){
            return priceA - priceB;
          }

          return String(a && a.name || '')
            .localeCompare(
              String(b && b.name || ''),
              'th'
            );

        }
      );

  }



  /* ==================================================
     PRODUCTS
  ================================================== */


  function renderProducts(){

    const products =
      getFilteredProducts();


    const grid =
      document.getElementById(
        'productGrid'
      );


    grid.innerHTML = '';


    products.forEach(
      function(product){

        grid.appendChild(
          createProductCard(product)
        );

      }
    );


    document
      .getElementById(
        'productCount'
      )
      .textContent =
        products.length +
        ' รายการ';


    document
      .getElementById(
        'emptyState'
      )
      .style.display =
        products.length === 0
          ? 'block'
          : 'none';

  }



  function createProductCard(product){

    const card =
      document.createElement(
        'div'
      );


    card.className =
      'product-card';



    const categoryName =
      getCategoryName(
        product.category
      );



    const imageHtml =
      createProductImage(
        product
      );



    card.innerHTML = `

      <div class="product-image">

        <div class="category-badge">
          ${escapeHtml(categoryName)}
        </div>

        ${imageHtml}

      </div>


      <div class="product-body">


        <div class="product-name">
          ${escapeHtml(product.name)}
        </div>


        <div class="price-row">

          <span class="price">
            ${formatNumber(product.price)}
          </span>

          <span class="baht">
            บาท / ${escapeHtml(product.unit)}
          </span>

        </div>


        <div class="stock-line">

          <span class="stock-label">
            สินค้าคงเหลือ
          </span>

          <span class="stock-value">

            ${formatNumber(product.stock)}
            ${escapeHtml(product.unit)}

          </span>

        </div>


      </div>

    `;


    return card;

  }



  /* ==================================================
     IMAGE
  ================================================== */


  function createProductImage(product){

    if(product.imageUrl){

      return `

        <img
          class="product-photo"
          src="${escapeHtml(product.imageUrl)}"
          alt="${escapeHtml(product.name)}"
          onerror="
            this.style.display='none';
            this.nextElementSibling.style.display='flex';
          "
        >

        <div
          class="product-placeholder"
          style="display:none;"
        >
          ${placeholderIcon()}
        </div>

      `;

    }


    return `

      <div class="product-placeholder">
        ${placeholderIcon()}
      </div>

    `;

  }



  function placeholderIcon(){

    return `

      <svg
        viewBox="0 0 64 64"
        fill="none"
      >

        <path
          d="M15 25H49L46 52H18L15 25Z"
          stroke="#5D9B73"
          stroke-width="4"
          stroke-linejoin="round"
        />

        <path
          d="M23 26V20C23 14.5 27 11 32 11C37 11 41 14.5 41 20V26"
          stroke="#5D9B73"
          stroke-width="4"
          stroke-linecap="round"
        />

      </svg>

    `;

  }



  /* ==================================================
     BEST SELLER
  ================================================== */


  function renderBestSellers(){

    let products =
      allProducts.slice();


    /*
      เลือกตามประเภทสินค้า
      Top 3 จะเปลี่ยนตามประเภทด้วย
    */

    if(
      selectedCategory !==
      'ทั้งหมด'
    ){

      products =
        products.filter(
          function(product){

            return (
              normalizeCategoryValue(product.category) ===
              normalizeCategoryValue(selectedCategory)
            );

          }
        );

    }



    const ranking =
      products

        .map(
          function(product){

            return {

              id:
                product.id,

              name:
                product.name,

              quantity:
                Number(
                  salesTotals[
                    product.id
                  ] || 0
                )

            };

          }
        )

        .filter(
          function(product){

            return (
              product.quantity > 0
            );

          }
        )

        .sort(
          function(a,b){

            return (
              b.quantity -
              a.quantity
            );

          }
        )

        .slice(0,3);



    const grid =
      document.getElementById(
        'bestSellerGrid'
      );


    grid.innerHTML = '';



    if(
      ranking.length === 0
    ){

      grid.innerHTML = `

        <div
          style="
            grid-column:1/-1;
            padding:25px;
            text-align:center;
            color:#929d96;
            font-size:13px;
            background:#fff;
            border:1px solid #e2ebe5;
            border-radius:18px;
          "
        >
          ยังไม่มีข้อมูลยอดขาย
        </div>

      `;


      return;

    }



    ranking.forEach(
      function(product,index){

        const rank =
          index + 1;


        const card =
          document.createElement(
            'div'
          );


        card.className =
          'best-card rank-' +
          rank;


        card.innerHTML = `

          <div class="rank-box">

            <div class="rank-label">
              อันดับ
            </div>

            <div class="rank-number">
              ${rank}
            </div>

          </div>


          <div class="best-info">

            <div class="best-name">
              ${escapeHtml(product.name)}
            </div>

            <div class="best-sales">

              ขายแล้ว

              <strong>
                ${formatNumber(product.quantity)}
              </strong>

              ชิ้น

            </div>

          </div>

        `;


        grid.appendChild(card);

      }
    );

  }



  /* ==================================================
     CATEGORY
  ================================================== */


  function renderCategoryFilters(){

    const row =
      document.getElementById(
        'categoryFilterRow'
      );

    if(!row){
      return;
    }


    const seen = new Set();

    const categories =
      allProducts
        .map(
          function(product){
            return normalizeCategoryValue(
              product.category
            );
          }
        )
        .filter(
          function(category){

            if(!category || seen.has(category)){
              return false;
            }

            seen.add(category);
            return true;

          }
        )
        .sort(
          function(a, b){
            return a.localeCompare(b, 'th');
          }
        );


    const available =
      new Set(categories);


    if(
      selectedCategory !== 'ทั้งหมด' &&
      !available.has(
        normalizeCategoryValue(
          selectedCategory
        )
      )
    ){
      selectedCategory = 'ทั้งหมด';
    }


    row.innerHTML = '';


    const allButton =
      document.createElement('button');

    allButton.className =
      'filter-button' +
      (
        selectedCategory === 'ทั้งหมด'
          ? ' active'
          : ''
      );

    allButton.dataset.category =
      'ทั้งหมด';

    allButton.textContent =
      'ทั้งหมด';

    allButton.onclick =
      function(){
        selectCategory(allButton);
      };

    row.appendChild(allButton);


    categories.forEach(
      function(category){

        const button =
          document.createElement('button');

        button.className =
          'filter-button' +
          (
            normalizeCategoryValue(
              selectedCategory
            ) === category
              ? ' active'
              : ''
          );

        button.dataset.category =
          category;

        button.textContent =
          category;

        button.onclick =
          function(){
            selectCategory(button);
          };

        row.appendChild(button);

      }
    );

  }



  function selectCategory(button){

    document
      .querySelectorAll(
        '.filter-button'
      )
      .forEach(
        function(item){

          item
            .classList
            .remove('active');

        }
      );


    button
      .classList
      .add('active');


    selectedCategory =
      button.dataset.category;


    renderAll();

  }



  function normalizeCategoryValue(category){

    return String(category || '').trim();

  }


  function getCategoryName(category){
    return normalizeCategoryValue(category);
  }



  /* ==================================================
     BACK
  ================================================== */


  function goBackMember(){

    let savedMemberId = '';

    try {
      savedMemberId = String(
        new URLSearchParams(window.location.search).get('memberId') || ''
      ).trim();
    } catch (e) {}

    try {
      if (!savedMemberId) {
        savedMemberId = String(
          sessionStorage.getItem('baacMemberId') ||
          localStorage.getItem('baacMemberId') || ''
        ).trim();
      }
    } catch (e) {}

    const memberUrl =
      'member.html' +
      (
        savedMemberId
          ? '?memberId=' + encodeURIComponent(savedMemberId)
          : ''
      );

    window.location.assign(memberUrl);

  }



  /* ==================================================
     ERROR
  ================================================== */


  function showError(message){

    document
      .getElementById(
        'content'
      )
      .style.display =
        'none';


    document
      .getElementById(
        'errorState'
      )
      .style.display =
        'block';


    document
      .getElementById(
        'errorMessage'
      )
      .textContent =
        message;

  }



  /* ==================================================
     UTILITIES
  ================================================== */


  function formatNumber(value){

    const number =
      Number(value || 0);


    return number
      .toLocaleString(
        'th-TH'
      );

  }



  function escapeHtml(value){

    return String(
      value == null
        ? ''
        : value
    )

      .replace(
        /&/g,
        '&amp;'
      )

      .replace(
        /</g,
        '&lt;'
      )

      .replace(
        />/g,
        '&gt;'
      )

      .replace(
        /"/g,
        '&quot;'
      )

      .replace(
        /'/g,
        '&#039;'
      );

  }



  /* ==================================================
     START
  ================================================== */


  document.addEventListener(
    'DOMContentLoaded',
    loadProducts
  );

