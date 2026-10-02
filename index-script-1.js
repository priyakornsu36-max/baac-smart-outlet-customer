

    function openCustomerLogin() {

      document
        .getElementById('customerModal')
        .classList.add('show');

      setTimeout(function() {

        document
          .getElementById('customerPhone')
          .focus();

      }, 100);

    }


    function openCustomerRegister() {

      closeModal('customerModal');

      const loginPhone =
        document
          .getElementById('customerPhone')
          .value
          .replace(/\D/g, '')
          .trim();

      if (loginPhone) {
        document
          .getElementById('registerPhone')
          .value = loginPhone;
      }

      document
        .getElementById('customerRegisterModal')
        .classList.add('show');

      setTimeout(function() {
        document
          .getElementById('registerFirstName')
          .focus();
      }, 100);
    }


    function openConsignorLogin() {

      document
        .getElementById('consignorModal')
        .classList.add('show');

      setTimeout(function() {

        document
          .getElementById('consignorPhone')
          .focus();

      }, 100);

    }


    function closeModal(id) {

      document
        .getElementById(id)
        .classList.remove('show');

    }


    function customerLogin() {

      const phone =
        document
          .getElementById('customerPhone')
          .value
          .replace(/\D/g, '')
          .trim();

      if (!phone) {

        showBaacPopup('กรุณาตรวจสอบข้อมูล', 'กรุณากรอกเบอร์โทรศัพท์', 'warning');
        return;

      }

      if (phone.length !== 10) {

        showBaacPopup('กรุณาตรวจสอบข้อมูล', 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก', 'warning');
        return;

      }

      const button =
        document.getElementById(
          'customerLoginButton'
        );

      button.disabled = true;
      button.textContent = 'กำลังตรวจสอบ...';

      google.script.run

        .withSuccessHandler(
          function(result) {

            button.disabled = false;
            button.textContent = 'เข้าสู่ระบบ';

            if (
              !result ||
              !result.success
            ) {

              showBaacPopup(
                'ไม่พบข้อมูล',
                result && result.message
                  ? result.message
                  : 'ไม่พบข้อมูลสมาชิก',
                'warning'
              );

              return;
            }

            const memberId =
              result.memberId;

            if (!memberId) {

              showBaacPopup(
                'เกิดข้อผิดพลาด',
                'ไม่สามารถอ่านรหัสสมาชิกได้',
                'error'
              );

              return;
            }

            try {

              localStorage.setItem(
                'baacMemberId',
                memberId
              );
              sessionStorage.setItem(
                'baacMemberId',
                memberId
              );

              if(result.member){
                localStorage.setItem(
                  'baacMemberSnapshot',
                  JSON.stringify({
                    memberId: memberId,
                    member: result.member,
                    savedAt: Date.now()
                  })
                );
              }

            } catch (e) {

              console.log(
                'ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบในเครื่องได้'
              );
            }

            window.open(
              'member.html?memberId=' +
              encodeURIComponent(memberId),
              '_top'
            );

          }
        )

        .withFailureHandler(
          function(error) {

            button.disabled = false;
            button.textContent = 'เข้าสู่ระบบ';

            showBaacPopup(
              'เกิดข้อผิดพลาด',
              'เกิดข้อผิดพลาดในการตรวจสอบสมาชิก',
              'error'
            );

            console.error(error);

          }
        )

        .loginCustomer(phone);

    }


    function registerCustomer() {

      const firstName =
        document
          .getElementById('registerFirstName')
          .value
          .trim();

      const lastName =
        document
          .getElementById('registerLastName')
          .value
          .trim();

      const phone =
        document
          .getElementById('registerPhone')
          .value
          .replace(/\D/g, '')
          .trim();

      if (!firstName) {
        showBaacPopup(
          'กรุณาตรวจสอบข้อมูล',
          'กรุณากรอกชื่อ',
          'warning'
        );
        return;
      }

      if (!lastName) {
        showBaacPopup(
          'กรุณาตรวจสอบข้อมูล',
          'กรุณากรอกนามสกุล',
          'warning'
        );
        return;
      }

      if (phone.length !== 10) {
        showBaacPopup(
          'กรุณาตรวจสอบข้อมูล',
          'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก',
          'warning'
        );
        return;
      }

      const button =
        document.getElementById(
          'customerRegisterButton'
        );

      button.disabled = true;
      button.textContent = 'กำลังสมัคร...';

      google.script.run

        .withSuccessHandler(
          function(result) {

            button.disabled = false;
            button.textContent = 'สมัครสมาชิก';

            if (!result || !result.success) {

              showBaacPopup(
                result && result.alreadyMember
                  ? 'เป็นสมาชิกอยู่แล้ว'
                  : 'สมัครสมาชิกไม่สำเร็จ',
                result && result.message
                  ? result.message
                  : 'ไม่สามารถสมัครสมาชิกได้',
                'warning',
                result && result.alreadyMember
                  ? function() {
                      closeModal('customerRegisterModal');
                      document
                        .getElementById('customerPhone')
                        .value = phone;
                      openCustomerLogin();
                    }
                  : null
              );

              return;
            }

            const memberId =
              result.memberId;

            if (!memberId) {
              showBaacPopup(
                'เกิดข้อผิดพลาด',
                'ไม่สามารถอ่านรหัสสมาชิกได้',
                'error'
              );
              return;
            }

            try {
              localStorage.setItem(
                'baacMemberId',
                memberId
              );
              sessionStorage.setItem(
                'baacMemberId',
                memberId
              );

              if(result.member){
                localStorage.setItem(
                  'baacMemberSnapshot',
                  JSON.stringify({
                    memberId: memberId,
                    member: result.member,
                    savedAt: Date.now()
                  })
                );
              }
            } catch (e) {
              console.log(
                'ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบในเครื่องได้'
              );
            }

            showBaacPopup(
              'สมัครสมาชิกสำเร็จ',
              (result.memberName || 'สมาชิกใหม่') +
                ' (' + memberId + ')',
              'success',
              function() {
                window.open(
                  'member.html?memberId=' +
                  encodeURIComponent(memberId),
                  '_top'
                );
              }
            );
          }
        )

        .withFailureHandler(
          function(error) {

            button.disabled = false;
            button.textContent = 'สมัครสมาชิก';

            showBaacPopup(
              'เกิดข้อผิดพลาด',
              error && error.message
                ? error.message
                : 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
              'error'
            );

            console.error(error);
          }
        )

        .registerCustomerMember({
          firstName: firstName,
          lastName: lastName,
          phone: phone
        });
    }


    function consignorLogin() {

      const phone =
        document
          .getElementById('consignorPhone')
          .value
          .replace(/\D/g, '')
          .trim();

      if (!phone) {
        showBaacPopup(
          'กรุณาตรวจสอบข้อมูล',
          'กรุณากรอกเบอร์โทรศัพท์',
          'warning'
        );
        return;
      }

      if (phone.length !== 10) {
        showBaacPopup(
          'กรุณาตรวจสอบข้อมูล',
          'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก',
          'warning'
        );
        return;
      }

      const button =
        document.getElementById('consignorLoginButton');

      button.disabled = true;
      button.textContent = 'กำลังตรวจสอบ...';

      google.script.run
        .withSuccessHandler(function(result) {

          button.disabled = false;
          button.textContent = 'เข้าสู่ระบบ';

          if (!result || !result.success) {
            showBaacPopup(
              'ไม่พบข้อมูล',
              result && result.message
                ? result.message
                : 'ไม่พบข้อมูลผู้ฝากขาย',
              'warning'
            );
            return;
          }

          const consignorId =
            String(result.consignorId || '').trim();

          if (!consignorId) {
            showBaacPopup(
              'เกิดข้อผิดพลาด',
              'ไม่สามารถอ่านรหัสผู้ฝากขายได้',
              'error'
            );
            return;
          }

          // บันทึกซ้ำสอง storage เพื่อกัน iPhone/WebView ทำ session หลุด
          try {
            localStorage.setItem('baacConsignorId', consignorId);
            localStorage.setItem('baacConsignorPhone', phone);
          } catch (e) {}

          try {
            sessionStorage.setItem('baacConsignorId', consignorId);
            sessionStorage.setItem('baacConsignorPhone', phone);
          } catch (e) {}

          // ใส่รหัสทั้ง query และ hash เผื่อ WebView ตัด query ออก
          const target =
            './consignor.html?consignorId=' +
            encodeURIComponent(consignorId) +
            '#consignor=' +
            encodeURIComponent(consignorId);

          window.location.assign(target);
        })
        .withFailureHandler(function(error) {

          button.disabled = false;
          button.textContent = 'เข้าสู่ระบบ';

          showBaacPopup(
            'เกิดข้อผิดพลาด',
            error && error.message
              ? error.message
              : 'เกิดข้อผิดพลาดในการตรวจสอบผู้ฝากขาย',
            'error'
          );

          console.error(error);
        })
        .loginConsignor(phone);
    }

    document
      .getElementById('customerPhone')
      .addEventListener(
        'keydown',
        function(event) {

          if (event.key === 'Enter') {

            event.preventDefault();
            customerLogin();

          }

        }
      );


    document
      .getElementById('registerPhone')
      .addEventListener(
        'keydown',
        function(event) {

          if (event.key === 'Enter') {
            event.preventDefault();
            registerCustomer();
          }
        }
      );


    document
      .getElementById('consignorPhone')
      .addEventListener(
        'keydown',
        function(event) {

          if (event.key === 'Enter') {

            event.preventDefault();
            consignorLogin();

          }

        }
      );


    window.addEventListener(
      'click',
      function(event) {

        if (
          event.target
            .classList
            .contains('modal')
        ) {

          event.target
            .classList
            .remove('show');

        }

      }
    );

  

    /* =========================
       CUSTOMER LOGIN PERSISTENCE
       เปิดแอปครั้งถัดไปแล้วเข้าหน้าสมาชิกเดิมอัตโนมัติ
       จนกว่าผู้ใช้จะกด "ออกจากระบบ"
       ========================= */
    function resumeCustomerLogin() {
      var memberId = '';

      try {
        memberId = String(
          localStorage.getItem('baacMemberId') ||
          sessionStorage.getItem('baacMemberId') ||
          ''
        ).trim();

        if (memberId) {
          localStorage.setItem('baacMemberId', memberId);
          sessionStorage.setItem('baacMemberId', memberId);
        }
      } catch (e) {}

      if (!memberId) {
        return;
      }

      window.location.replace(
        'member.html?memberId=' +
        encodeURIComponent(memberId)
      );
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resumeCustomerLogin);
    } else {
      resumeCustomerLogin();
    }

