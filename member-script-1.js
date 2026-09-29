

      let memberId = '';

      /* =========================================================
         MEMBER SESSION
         - ใช้ memberId จาก URL ก่อน
         - ถ้า URL หาย ให้กู้จาก localStorage ที่บันทึกตอน Login
         - ป้องกันกรณีกลับจากหน้าสินค้าแล้วข้อมูลสมาชิกหาย
         ========================================================= */

      function resolveMemberId(){
        let id = String(memberId || '').trim();

        try {
          if (!id) {
            id = String(localStorage.getItem('baacMemberId') || '').trim();
          }

          if (id) {
            localStorage.setItem('baacMemberId', id);
          }
        } catch (e) {}

        memberId = id;
        return id;
      }

      resolveMemberId();


      /* =========================
         โหลดข้อมูลสมาชิกจริง
         ========================= */

      function loadMember(){

        if(!resolveMemberId()){

          alert(
            'ไม่พบข้อมูลสมาชิก กรุณาเข้าสู่ระบบใหม่'
          );

          window.open(
            'index.html',
            '_top'
          );

          return;
        }


        google.script.run

          .withSuccessHandler(
            function(result){

              if(
                !result ||
                !result.success
              ){

                alert(
                  result && result.message
                    ? result.message
                    : 'ไม่พบข้อมูลสมาชิก'
                );

                return;
              }


              renderMember(
                result.member
              );

            }
          )

          .withFailureHandler(
            function(error){

              alert(
                'เกิดข้อผิดพลาดในการโหลดข้อมูลสมาชิก'
              );

              console.error(error);

            }
          )

          .getMemberData(memberId);

      }


      /* =========================
         แสดงข้อมูลสมาชิก
         ========================= */

      function renderMember(member){

        document
          .getElementById(
            'memberWelcome'
          )
          .textContent =
            'สวัสดี คุณ' +
            member.firstName +
            ' 👋';


        const currentPoints =
          Number(member && member.points);

        document
          .getElementById(
            'memberPoints'
          )
          .textContent =
            Number.isFinite(currentPoints)
              ? formatMoney(currentPoints)
              : '0';


        document
          .getElementById(
            'pointsYear'
          )
          .textContent =
            member.pointsYear || '-';

        renderRewardStatus(
          member.rewards || {}
        );


        document
          .getElementById(
            'currentLevelText'
          )
          .textContent =
            'ระดับปัจจุบัน · ' +
            member.tier;


        document
          .getElementById(
            'nextLevelText'
          )
          .textContent =
            member.nextText;


        document
          .getElementById(
            'progressBar'
          )
          .style.width =
            member.progressPercent +
            '%';


        document
          .getElementById(
            'memberFullName'
          )
          .textContent =
            member.firstName +
            ' ' +
            member.lastName;


        document
          .getElementById(
            'memberPhone'
          )
          .textContent =
            member.phone;


        document
          .getElementById(
            'memberJoinDate'
          )
          .textContent =
            member.joinDate;


        const photoMemberIdInput =
          document.getElementById('memberPhotoMemberId');

        if(photoMemberIdInput){
          photoMemberIdInput.value =
            String(member.memberId || memberId || '').trim();
        }

        renderMemberPhoto(
          member.photoUrl || ''
        );


        updateTierCurrent(
          member.tier
        );

      }


      /* =========================
         รูปสมาชิก
         ========================= */

      function renderMemberPhoto(photoUrl){

        const photo =
          document.getElementById('memberPhoto');

        const fallback =
          document.getElementById('memberPhotoFallback');

        const button =
          document.getElementById('memberPhotoButton');

        if(!photo || !fallback || !button){
          return;
        }

        photoUrl = String(photoUrl || '').trim();

        if(!photoUrl){
          photo.removeAttribute('src');
          photo.style.display = 'none';
          fallback.style.display = 'block';
          button.textContent = 'เพิ่มรูป';
          return;
        }

        photo.onload = function(){
          photo.style.display = 'block';
          fallback.style.display = 'none';
          button.textContent = 'เปลี่ยนรูป';
        };

        photo.onerror = function(){
          photo.style.display = 'none';
          fallback.style.display = 'block';
          button.textContent = 'เปลี่ยนรูป';
        };

        photo.src = photoUrl;
      }


      function chooseMemberPhoto(){

        const input =
          document.getElementById('memberPhotoInput');

        if(input){
          input.click();
        }
      }


      function setMemberPhotoStatus(message, type){

        const status =
          document.getElementById('memberPhotoStatus');

        if(!status){
          return;
        }

        status.classList.remove(
          'success',
          'error'
        );

        if(type){
          status.classList.add(type);
        }

        status.textContent = message || '';
      }


      function setMemberPhotoBusy(isBusy){

        const button =
          document.getElementById('memberPhotoButton');

        if(!button){
          return;
        }

        button.disabled = !!isBusy;

        if(isBusy){
          button.textContent = 'กำลังบันทึก...';
        }
      }


      function handleMemberPhotoSelected(event){

        const input = event && event.target;
        const file = input && input.files
          ? input.files[0]
          : null;

        if(!file){
          return;
        }

        if(!/^image\/(jpeg|png|webp)$/i.test(file.type || '')){
          setMemberPhotoStatus(
            'รองรับเฉพาะรูป JPG, PNG หรือ WEBP',
            'error'
          );
          input.value = '';
          return;
        }

        if(file.size > 10 * 1024 * 1024){
          setMemberPhotoStatus(
            'รูปมีขนาดใหญ่เกิน 10 MB',
            'error'
          );
          input.value = '';
          return;
        }

        saveMemberPhotoFile(file);
      }


      function resizeMemberPhotoToDataUrl(file){

        return new Promise(function(resolve, reject){

          const reader = new FileReader();

          reader.onerror = function(){
            reject(new Error('ไม่สามารถอ่านไฟล์รูปได้'));
          };

          reader.onload = function(){

            const image = new Image();

            image.onerror = function(){
              reject(new Error('ไม่สามารถเปิดไฟล์รูปได้'));
            };

            image.onload = function(){

              try{

                const maxSide = 480;
                const ratio = Math.min(
                  1,
                  maxSide / Math.max(image.width || 1, image.height || 1)
                );

                const width = Math.max(1, Math.round(image.width * ratio));
                const height = Math.max(1, Math.round(image.height * ratio));

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');

                if(!ctx){
                  reject(new Error('อุปกรณ์ไม่รองรับการย่อรูป'));
                  return;
                }

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(image, 0, 0, width, height);

                let quality = 0.82;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                while(dataUrl.length > 42000 && quality > 0.35){
                  quality -= 0.08;
                  dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                if(dataUrl.length > 45000){
                  reject(new Error('รูปยังมีขนาดใหญ่เกินไป กรุณาเลือกรูปใหม่'));
                  return;
                }

                resolve(dataUrl);

              }catch(error){
                reject(error);
              }
            };

            image.src = String(reader.result || '');
          };

          reader.readAsDataURL(file);
        });
      }


      async function saveMemberPhotoFile(file){

        if(!resolveMemberId()){
          setMemberPhotoStatus(
            'ไม่พบข้อมูลสมาชิก กรุณาเข้าสู่ระบบใหม่',
            'error'
          );
          return;
        }

        const input =
          document.getElementById('memberPhotoInput');

        setMemberPhotoBusy(true);
        setMemberPhotoStatus(
          'กำลังบันทึกรูป...',
          ''
        );

        try{

          const photoDataUrl =
            await resizeMemberPhotoToDataUrl(file);

          google.script.run
            .withSuccessHandler(
              function(result){

                setMemberPhotoBusy(false);

                if(!result || !result.success){
                  setMemberPhotoStatus(
                    result && result.message
                      ? result.message
                      : 'บันทึกรูปไม่สำเร็จ',
                    'error'
                  );

                  if(input){
                    input.value = '';
                  }

                  loadMember();
                  return;
                }

                renderMemberPhoto(
                  String(result.photoUrl || photoDataUrl || '')
                );

                setMemberPhotoStatus(
                  'บันทึกรูปเรียบร้อย ✓',
                  'success'
                );

                if(input){
                  input.value = '';
                }
              }
            )
            .withFailureHandler(
              function(error){

                setMemberPhotoBusy(false);

                const message =
                  error && error.message
                    ? error.message
                    : String(error || 'ไม่ทราบสาเหตุ');

                setMemberPhotoStatus(
                  'บันทึกรูปไม่สำเร็จ: ' + message,
                  'error'
                );

                console.error(error);

                if(input){
                  input.value = '';
                }

                loadMember();
              }
            )
            .updateMemberPhotoData(
              memberId,
              photoDataUrl
            );

        }catch(error){

          setMemberPhotoBusy(false);

          setMemberPhotoStatus(
            error && error.message
              ? error.message
              : 'ไม่สามารถเตรียมรูปสำหรับบันทึกได้',
            'error'
          );

          if(input){
            input.value = '';
          }
        }
      }

      /* =========================
         สิทธิ์รางวัลประจำปี
         ========================= */

      function renderRewardStatus(rewards){

        rewards = rewards || {};

        setRewardState(
          'silverRewardStatus',
          rewards.silver || {}
        );

        setRewardState(
          'goldRewardStatus',
          rewards.gold || {}
        );

      }


      function setRewardState(id, reward){

        const el =
          document.getElementById(id);

        if(!el){
          return;
        }

        el.classList.remove(
          'locked',
          'ready',
          'done'
        );

        if(reward.redeemed){

          el.classList.add('done');

          el.textContent =
            'รับแล้ว ✓' +
            (
              reward.date
                ? ' · ' + reward.date
                : ''
            );

          return;
        }

        if(reward.eligible){

          el.classList.add('ready');

          el.textContent =
            'มีสิทธิ์รับรางวัล';

          return;
        }

        el.classList.add('locked');

        el.textContent =
          'ยังไม่มีสิทธิ์';

      }


      /* =========================
         ระดับปัจจุบัน
         ========================= */

      function updateTierCurrent(tier){

        const general =
          document.getElementById(
            'tierGeneral'
          );

        const silver =
          document.getElementById(
            'tierSilver'
          );

        const gold =
          document.getElementById(
            'tierGold'
          );


        general.classList.remove(
          'current'
        );

        silver.classList.remove(
          'current'
        );

        gold.classList.remove(
          'current'
        );


        if(tier === 'สมาชิก Gold'){

          gold.classList.add(
            'current'
          );

          return;
        }


        if(tier === 'สมาชิก Silver'){

          silver.classList.add(
            'current'
          );

          return;
        }


        general.classList.add(
          'current'
        );

      }


      /* =========================
         ไปหน้าสินค้า
         ========================= */

      function openProducts(){

        window.open(
          'products.html?memberId=' +
          encodeURIComponent(memberId),
          '_top'
        );

      }


      /* =========================
         ออกจากระบบสมาชิก
         ========================= */