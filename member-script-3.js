

    function openPurchaseHistory(){

      const modal =
        document.getElementById('purchaseHistoryModal');

      modal.classList.add('show');

      document.getElementById('historyLoading').style.display =
        'block';

      document.getElementById('historyContent').style.display =
        'none';

      document.getElementById('historyEmpty').style.display =
        'none';


      google.script.run

        .withSuccessHandler(function(result){

          document.getElementById('historyLoading').style.display =
            'none';


          if(!result || !result.success){

            alert(
              result && result.message
                ? result.message
                : 'ไม่สามารถโหลดประวัติการซื้อได้'
            );

            return;
          }


          if(!result.history || result.history.length === 0){

            document.getElementById('historyEmpty').style.display =
              'block';

            return;
          }


          const list =
            document.getElementById('historyList');

          list.innerHTML = '';


          result.history.forEach(function(bill){

            const div =
              document.createElement('div');

            div.className =
              'history-item';


            const productRows =
              (bill.items || []).map(function(item){

                return (
                  '<div class="history-product-row">' +

                    '<div class="history-product-row-name">' +
                      escapeHtml(item.productName) +
                    '</div>' +

                    '<div class="history-product-row-qty">' +
                      'จำนวน ' +
                      formatMoney(item.quantity) +
                    '</div>' +

                    '<div class="history-product-row-amount">' +
                      formatMoney(item.amount) +
                      ' บาท' +
                    '</div>' +

                  '</div>'
                );

              }).join('');


            div.innerHTML =

              '<div class="history-item-top">' +

                '<div>' +

                  '<div class="history-bill-id">' +
                    (
                      bill.billId
                        ? 'เลขที่บิล ' + escapeHtml(bill.billId)
                        : 'รายการซื้อ'
                    ) +
                  '</div>' +

                  '<div class="history-product">' +
                    'สินค้า ' +
                    formatMoney((bill.items || []).length) +
                    ' รายการ' +
                  '</div>' +

                '</div>' +

                '<div class="history-price">' +
                  '<span class="history-price-label">ยอดรวมบิล</span>' +
                  '<strong>' +
                    formatMoney(bill.totalAmount) +
                    ' บาท' +
                  '</strong>' +
                '</div>' +

              '</div>' +


              '<div class="history-products">' +
                productRows +
              '</div>' +


              '<div class="history-detail">' +

                '<span class="history-tag history-points-tag">' +
                  'คะแนนที่ได้รับ ' +
                  formatMoney(bill.earnedPoints || 0) +
                  ' คะแนน' +
                '</span>' +

                '<span class="history-tag">' +
                  'ชำระด้วย ' +
                  escapeHtml(bill.payment) +
                '</span>' +

                '<span class="history-tag history-date-tag">' +
                  escapeHtml(bill.date) +
                  ' เวลา ' +
                  escapeHtml(bill.time) +
                '</span>' +

              '</div>';


            list.appendChild(div);

          });


          document.getElementById('historyContent').style.display =
            'block';

        })


        .withFailureHandler(function(error){

          document.getElementById('historyLoading').style.display =
            'none';

          alert(
            'เกิดข้อผิดพลาดในการโหลดประวัติการซื้อ'
          );

          console.error(error);

        })


        .getMemberPurchaseHistory(memberId);

    }


    function closePurchaseHistory(){

      document
        .getElementById('purchaseHistoryModal')
        .classList.remove('show');

    }


    function formatMoney(value){

      return Number(value || 0)
        .toLocaleString('th-TH');

    }


    function escapeHtml(value){

      const div =
        document.createElement('div');

      div.textContent =
        value == null ? '' : value;

      return div.innerHTML;

    }


    document
      .getElementById('purchaseHistoryModal')
      .addEventListener('click',function(event){

        if(event.target === this){
          closePurchaseHistory();
        }

      });

    