
      function logoutMember(){

        try{
          localStorage.removeItem('baacMemberId');
        }catch(e){}

        memberId = '';

        window.open(
          'index.html',
          '_top'
        );

      }


      /* =========================
         ประวัติการซื้อ
         ========================= */

      function openPurchaseHistory(){

        alert(
          'เราจะสร้างหน้าประวัติการซื้อในขั้นตอนถัดไป'
        );

      }


      window.addEventListener(
        'DOMContentLoaded',
        loadMember
      );

    