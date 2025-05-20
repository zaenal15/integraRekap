userListsSection = document.querySelector('#user-lists');
userListsSectionNoData = document.querySelector('#user-lists-no-data');

// CLEAR INTERVAL FUNCTIONS --ir
clearAllIntevalFunction()

// ADD CONTENT MODAL --ir
modals = ['#modal-add-user', '#modal-add-group', '#modal-rename-group'];
fillModalContent(modals);
modalAddUser = document.querySelector(modals[0]);
modalAddUGroup = document.querySelector(modals[1]);

setGroupPosition('');

// FUNCTION TO SET ROOMS TABLE --ir
function setGroupPosition(floor) {
  groupPositionSection = document.querySelector('#group-lists');
  groupPositionFilterSection = document.querySelector('#group-filter');
  groupPositionSection.innerHTML = '';
  groupPositionFilterSection.innerHTML = '';

  loadData('loadGroupPositon')
    .then(function (newData) {
      groupLists = newData;
    })
    .then(() => {
      openLoader();
    })
    .then(() => {
      groupPositionSection.innerHTML = `<button value="" onclick="changeGroupPosition(this, this.value)" class="group-button" data-position="">All</button>`;
      for (key in groupLists) {
        if (key == 'guest') continue;
        groupPositionSection.innerHTML += `<button value="${key}" onclick="changeGroupPosition(this, this.value)" class="group-button" data-position="${key}">${groupLists[key].position_name}</button>`;
        document.querySelector(
          '#new-position-field'
        ).innerHTML += `<option value="${key}">${groupLists[key].position_name}</option>`;
      }
      if (userInfo['Group_position'] == 'EP00')
        groupPositionFilterSection.innerHTML += `<button onclick="openModalAddGroup()" id="add-group-button"><i class="fa fa-plus-circle"></i></button>`;
      if (userInfo['Group_position'] == 'EP00')
        groupPositionFilterSection.innerHTML += `<button value="rename-group" onclick="openModalRenameGroup(this)" id="rename-group-button"><i class="fa fa-pencil-alt"></i></button>`;
      if (userInfo['Group_position'] == 'EP00')
        groupPositionFilterSection.innerHTML += `<button value="remove-group" onclick="removeUserGroup(this)" id="remove-group-button"><i class="fa fa-trash-alt"></i></button>`;
      groupPositionFilterSection.innerHTML += `<input placeholder="Search User" id="search-user-field" class="search-user"> `;

      groupPositionSection.querySelectorAll('button')[0].click();
    })
    .then(() => {
      closeLoader();

      // HANDLER TO SEARCH USER CARD --ir
      document.querySelector('#search-user-field').onkeyup = function () {
        let search = this.value.toLowerCase();
        foundOne = false;
        document.querySelector('#user-lists').style.display = 'none';
        document.querySelector('#user-lists-no-data').style.display = 'grid';
        document.querySelectorAll('.user-card').forEach((card) => {
          found = false;
          card.style.display = 'none';
          card
            .querySelectorAll('.user-info label, .user-info span, .user-info button')
            .forEach((field) => {
              if (found) return true;
              if (field.innerText.toLowerCase().indexOf(search) > -1) {
                card.style.display = 'grid';
                found = true;
                foundOne = true;
              }
            });
        });
        if (foundOne) {
          document.querySelector('#user-lists').style.display = 'grid';
          document.querySelector('#user-lists-no-data').style.display = 'none';
        }
      };
    });
}

// FUNTION TO OPEN MODAL ADDING NEW GROUP --ir
function openModalAddGroup() {
  if (!checkPrivileged('insert', 'user_list')) return false;
  openModal(modals[1]);
}

// FUNTION TO OPEN MODAL RENAME SELECTED GROUP --ir
function openModalRenameGroup() {
  if (!checkPrivileged('update', 'user_list')) return false;
  openModal(modals[2]);
  document.getElementById('new-group-name-field').value =
    document.querySelector('.group-button.active').innerText;
}

// FUNTION TO OPEN MODAL ADDING NEW USER --ir
function openModalAddUser() {
  if (!checkPrivileged('insert', 'user_list')) return false;
  openModal(modals[0]);
}

// CHANGE GROUP POSITION AND SET ALL USER --ir
function changeGroupPosition(el, value) {
  setAndremoveClassActive(el, '.group-button', '#group-lists', false, false);
  userListsSection.innerHTML = '';
  userListsSection.style.display = 'none';
  userListsSectionNoData.style.display = 'grid';
  document.querySelector('#add-new-user').style.display = 'block';
  document.querySelector('#search-user-field').value = '';

  loadData('loadUserLists', { userGroup: value, incudeClient: 'true' })
    .then(function (newData) {
      userListsAll = newData;
      if (Object.keys(userListsAll).length == 0) return false;
      document.querySelector('#add-new-user').style.display = 'none';
      userListsSection.style.display = 'grid';
      userListsSectionNoData.style.display = 'none';
      for (key in userListsAll) {
        userListsSection.innerHTML += `<div class="user-card" data-user="${key}"></div>`;
        userCard = userListsSection.querySelector('.user-card:last-child');

        // CARD USER HEADER --ir
        userCard.innerHTML += `<section onclick="seeUserInfo(this, this.value)" class="user-section" data-user="${key}"></section>`;
        userHead = userCard.querySelector('.user-section:last-child');

        // PHOTO --ir
        userHead.innerHTML += `<span class="user-name">${userListsAll[key].name}</span>`;
        userHead.innerHTML += `<img id="user-photo-${key}" src="${urlToAssets}/images/employee_pictures/${key}.jpg" class="user-photo">`;

        // USER INFO --ir
        currentStatusUser = userListsAll[key].user_status;
        if (currentStatusUser == 'inactive' && userListsAll[key].failed_attempts >= 5)
          currentStatusUser = 'blocked';
        if (currentStatusUser != 'active') userCard.classList.add(currentStatusUser);
        userHead.innerHTML += `<div class="user-info"></div>`;
        // userHead.querySelector('.user-info:last-child').innerHTML =  `<div class="basic-flex"><label>Name : </label><span>${userListsAll[key].name}</span></div>`
        userHead.querySelector(
          '.user-info:last-child'
        ).innerHTML = `<div class="basic-flex"><label>Username : </label><span>${userListsAll[key].username}</span></div>`;
        userHead.querySelector(
          '.user-info:last-child'
        ).innerHTML += `<div class="basic-flex"><label>Email : </label><span>${userListsAll[key].email}</span></div>`;
        userHead.querySelector(
          '.user-info:last-child'
        ).innerHTML += `<div class="basic-flex"><label>Status : </label><span>${firstUppercase(
          currentStatusUser
        )}</span></div>`;

        // CARD USER DETAIL --ir
        userCard.innerHTML += `<section class="user-detail" data-user="${key}"></section>`;
        userDetail = userCard.querySelector('.user-detail:last-child');

        // USER BUTTON GROUP --ir
        userDetail.innerHTML += `<div class="user-act"></div>`;
        valueUpdateAct = 'info';
        if (currentStatusUser == 'blocked') valueUpdateAct = 'recover';
        userDetail.querySelector(
          '.user-act:last-child'
        ).innerHTML = `<button onclick="changeUpdateAct(this, this.value)" data-section="info" value="${valueUpdateAct}" class="active change-section-user">Edit</button>`;
        userDetail.querySelector(
          '.user-act:last-child'
        ).innerHTML += `<button onclick="changeUpdateAct(this, this.value)" data-section="password" value="password" class="change-section-user">Password</button>`;
        userDetail.querySelector(
          '.user-act:last-child'
        ).innerHTML += `<button onclick="changeUpdateAct(this, this.value)" data-section="delete" value="delete" class="change-section-user">Delete</button>`;

        // USER UPDATE GROUP --ir
        userDetail.innerHTML += `<div data-section="info" class="user-update-section user-update-info"></div>`;
        userDetail.querySelector(
          '.user-update-info:last-child'
        ).innerHTML = `<input style="display:none; pointer-events:none;" type="hidden" class="id-field" value="${userListsAll[key].id}">`;
        userDetail.querySelector(
          '.user-update-info:last-child'
        ).innerHTML += `<div class="form-input basic-flex-reverse"><label>Name : </label><input class="name-field" value="${userListsAll[key].name}"></div>`;
        userDetail.querySelector(
          '.user-update-info:last-child'
        ).innerHTML += `<div class="form-input basic-flex-reverse"><label>Username : </label><input onchange="checkUsername(this, 'username', 'update')" class="username-field" data-username="${userListsAll[key].username}" value="${userListsAll[key].username}"></div>`;
        userDetail.querySelector(
          '.user-update-info:last-child'
        ).innerHTML += `<div class="form-input basic-flex-reverse"><label>Email : </label><input onchange="checkUsername(this, 'email', 'update')" class="email-field" data-email="${userListsAll[key].email}" value="${userListsAll[key].email}"></div>`;
        userDetail.querySelector(
          '.user-update-info:last-child'
        ).innerHTML += `<div class="form-input basic-flex-reverse"><label>Position : </label><select class="position-field" class="position-user"></select></div>`;
        userDetail.querySelector(
          '.user-update-info:last-child'
        ).innerHTML += `<div class="form-input basic-flex status-user-field"><label>Status : </label><div class="basic-flex"><button class="button-set status-user" value="active">Active</button><button class="button-set status-user" value="inactive">Inactive</button></div></div>`;
        for (pos in groupLists) {
          if (pos == 'guest') continue;
          userDetail.querySelector(
            '.user-update-info:last-child select'
          ).innerHTML += `<option value="${pos}">${groupLists[pos].position_name}</option>`;
        }
        userDetail.querySelector('.user-update-info:last-child select').value =
          userListsAll[key].group_position;
        userDetail
          .querySelector(
            '.user-update-info:last-child select option[value="' +
              userListsAll[key].group_position +
              '"]'
          )
          .setAttribute('selected', 'selected');
        userDetail
          .querySelector(
            `.user-update-info:last-child .status-user[value="${userListsAll[key].user_status}"]`
          )
          .classList.add('active');

        // USER UPDATE PASSWORD --ir
        userDetail.innerHTML += `<div data-section="password" class="user-update-section user-update-password"></div>`;
        userDetail.querySelector(
          '.user-update-password:last-child'
        ).innerHTML = `<div class="form-pass form-input basic-flex-reverse"><label>Old Password : </label><input onchange="checkPass(this, this.value)" class="user-old-password" type="password"><button class="see-pass" onmousedown="seePassIndividualHandler(this, 'see')" onmouseup="seePassIndividualHandler(this, 'hide')" value=""hide><i class="fa fa-eye-slash"></i></button></div>`;
        userDetail.querySelector(
          '.user-update-password:last-child'
        ).innerHTML += `<div class="form-pass form-input basic-flex-reverse"><label>New Password : </label><input onchange="checkPassStd(this, this.value)" class="user-new-password" type="password"><button class="see-pass" onmousedown="seePassIndividualHandler(this, 'see')" onmouseup="seePassIndividualHandler(this, 'hide')" value=""hide><i class="fa fa-eye-slash"></i></button></div>`;
        userDetail.querySelector(
          '.user-update-password:last-child'
        ).innerHTML += `<div class="form-pass form-input basic-flex-reverse"><label>Retype New Password : </label><input onchange="checkPassStd(this, this.value)" class="user-retype-password" type="password"><button class="see-pass" onmousedown="seePassIndividualHandler(this, 'see')" onmouseup="seePassIndividualHandler(this, 'hide')" value=""hide><i class="fa fa-eye-slash"></i></button></div>`;
        if (userInfo['Group_position'] == 'EP00')
          userDetail.querySelector(
            '.user-update-password:last-child'
          ).innerHTML += `<button value="reset password" onclick="updateUser(this, this.value)" class="button-set set-default-password">Set Password to default</button>`;

        // USER UPDATE BUTTON --ir
        console.log('currentStatusUser', currentStatusUser == 'blocked');
        if (currentStatusUser == 'blocked')
          userDetail.innerHTML += `<button class="update-user-button" value="recover" onclick="updateUser(this, this.value)"><i class="fas fa-pencil-alt"></i> Recover</button>`;
        else
          userDetail.innerHTML += `<button class="update-user-button" value="info" onclick="updateUser(this, this.value)"><i class="fas fa-pencil-alt"></i> Update</button>`;
      }

      // SECTION TO ADD NEW USER --ir
      newUserEl = `<div class="user-card" data-user="new">`;
      newUserEl += `<section onclick="openModalAddUser()" class="user-section add-user">`;
      newUserEl += `<img src="../../assets/svgs/user-male.svg" class="user-photo">`;
      newUserEl += `<div class="user-info"><button id="add-user-button">Add New User</button></div><div class="user-detail"></div>`;
      newUserEl += `</section>`;
      newUserEl += `</div>`;
      userListsSection.innerHTML += newUserEl;
    })
    .then(() => {
      userListsSection.querySelectorAll('.form-input:not(.status-user-field)').forEach((field) => {
        field.onclick = function () {
          field.closest('.form-input').querySelectorAll('input, select')[0].focus();
        };
      });
      userListsSection
        .querySelectorAll('.form-input:not(.status-user-field) *')
        .forEach((field) => {
          field.onclick = function () {
            field.closest('.form-input').querySelectorAll('input, select')[0].focus();
          };
        });
      userListsSection.querySelectorAll('.status-user').forEach((button) => {
        button.onclick = function () {
          setAndremoveClassActive(button, '.status-user', '.form-input', false, false);
        };
      });

      document.querySelectorAll('.user-photo').forEach((photo) => {
        photo.addEventListener('error', function handleError() {
          this.setAttribute('src', `../../assets/svgs/user-male.svg`);
        });
      });
    });
}

// FUNCTION TO CHECK USERNAME OR NIK ON UPDATE USER --ir
function checkUsername(el, field, act) {
  if (act == 'update') valUserEmailBefore = el.getAttribute('data-' + field);
  $.ajax({
    url: 'checkUsername',
    type: 'POST',
    dataType: 'JSON',
    data: {
      field: el.value,
    },
    success: function (data) {
      if (data == 'exist') {
        if (act == 'update') el.value = valUserEmailBefore;
        else el.value = '';
        el.focus();
        Swal.fire(
          'Hold on!',
          `${firstUppercase(field)} already exist! Please change another ${field}.`,
          'info'
        );
        return;
      } else {
        if (act == 'update') el.setAttribute('data-' + field, el.value);
      }
    },
  });
}

// OPEN CARD USER --ir
function seeUserInfo(el, value) {
  setAndremoveClassActive(el, '.user-section', '.user-card', true, false);
  document.querySelectorAll('.user-card').forEach((card) => {
    card.querySelector('.user-detail').style.display = 'none';
  });
  el.parentNode.querySelector('.user-detail').style.display = 'grid';
  el.parentNode.querySelectorAll('.user-detail .user-act .change-section-user')[0].click();
}

// CHANGE UPDATE ACT --ir
function changeUpdateAct(el, value) {
  id = el.closest('.user-detail').querySelector('.id-field').value;
  nameUser = el.closest('.user-detail').querySelector('.name-field').value;
  username = el.closest('.user-detail').querySelector('.username-field').value;
  email = el.closest('.user-detail').querySelector('.email-field').value;
  infoSwal = `<span>User : <b> ${username} </b></span><br> `;
  infoSwal += `<span>Name : <b> ${nameUser} </b></span><br> `;
  infoSwal += `<span>Email : <b> ${email} </b></span>`;

  if (value != 'delete') {
    setAndremoveClassActive(el, '.change-section-user', '.user-act', false, false);
    el.closest('.user-detail')
      .querySelectorAll('.user-update-section')
      .forEach((item) => {
        item.style.display = 'none';
      });
    el
      .closest('.user-detail')
      .querySelector(
        '.user-update-section[data-section="' + el.getAttribute('data-section') + '"]'
      ).style.display = 'flex';
    el.closest('.user-detail').querySelector('.update-user-button').value = value;
  } else {
    if (!checkPrivileged('delete', 'user_list')) return false;
    Swal.fire({
      title: 'Hold on!',
      html: 'Are you sure to delete this user?' + infoSwal,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: colorThemes['b7-clr-org-1'],
      cancelButtonColor: colorThemes['b7-clr-blu-2'],
      confirmButtonText: 'Yes!',
      confirmButtonText: '<i class="fas fa-power-off"></i> Yes, delete this!',
      confirmButtonAriaLabel: 'Delete!',
      cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
      cancelButtonAriaLabel: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: 'deleteUser',
          type: 'POST',
          dataType: 'JSON',
          data: {
            id: id,
            name: nameUser,
            username: username,
            email: email,
          },
          beforeSend: function () {
            openLoader();
          },
          success: function (data) {
            if (data == 'success') {
              Swal.fire({
                title: '<strong>Success</strong>',
                icon: 'success',
                html: `Successfully delete this user! <br><br>` + infoSwal,
              });
              el.closest('.user-card').remove();
            } else {
              Swal.fire({
                title: '<strong>Hold on!</strong>',
                icon: 'warning',
                html: `Failed to delete this user! <br><br>` + infoSwal,
              });
            }
          },
          complete: function () {
            closeLoader();
          },
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: '<strong>Cancelled!</strong>',
          icon: 'info',
          html: `Cancel to delete this user! <br><br>` + infoSwal,
        });
      }
    });
  }
}

// UPDATE INFO OR PASSOWRD --ir
function updateUser(el, value) {
  if (!checkPrivileged('update', 'user_list')) return false;

  id = el.closest('.user-detail').querySelector('.id-field').value;
  nameUser = el.closest('.user-detail').querySelector('.name-field').value;
  username = el.closest('.user-detail').querySelector('.username-field').value;
  email = el.closest('.user-detail').querySelector('.email-field').value;
  usernameBefore = el
    .closest('.user-detail')
    .querySelector('.username-field')
    .getAttribute('data-username');
  emailBefore = el.closest('.user-detail').querySelector('.email-field').getAttribute('data-email');
  position = el.closest('.user-detail').querySelector('.position-field').value;
  statusUser = el.closest('.user-detail').querySelector('.status-user.active').value;
  positionText = el.closest('.user-detail').querySelector('.position-field');
  positionText = positionText.options[positionText.selectedIndex].text;
  statusUserText = el.closest('.user-detail').querySelector('.status-user.active').innerText;

  if (value == 'info' || value == 'recover') {
    if (!nameUser || !username || !email || !position || !statusUser) {
      Swal.fire(`Hold on!`, `Please input all field above!`, `warning`);
      return false;
    }

    url = 'updateUser';
    dataPost = {
      id: id,
      nameUser: nameUser,
      username: username,
      usernameBefore: usernameBefore,
      email: email,
      position: position,
      positionText: positionText,
      statusUser: statusUser,
      statusUserText: statusUserText,
    };

    if (value == 'recover') {
      url = 'recoverUser';
      statusUser = 'active';
      statusUserText = 'Active';
      dataPost[statusUser] = statusUser;
      dataPost[statusUserText] = statusUserText;
    }
  } else {
    url = 'changePass';
    if (value != 'reset password') {
      el.closest('.user-detail').querySelector('.user-old-password').onchange();
      oldPass = el.closest('.user-detail').querySelector('.user-old-password').value;
      newPass = el.closest('.user-detail').querySelector('.user-new-password').value;
      retypePass = el.closest('.user-detail').querySelector('.user-retype-password').value;
      if (!oldPass || !newPass || !retypePass) {
        Swal.fire(`Hold on!`, `Please input all field above!`, `warning`);
        return false;
      }

      if (newPass != retypePass) {
        Swal.fire('Hold on!', 'New password and retype new password did not match!', 'warning');
        return false;
      }

      dataPost = {
        id: id,
        nameUser: nameUser,
        username: username,
        usernameBefore: usernameBefore,
        email: email,
        newPass: newPass,
      };
    } else {
      dataPost = {
        id: id,
        nameUser: nameUser,
        username: username,
        usernameBefore: usernameBefore,
        email: email,
        newPass: 'reset-pass',
      };
    }
  }

  infoSwal = `<span>User : <b> ${username} </b></span><br> `;
  infoSwal += `<span>Name : <b> ${nameUser} </b></span><br> `;
  infoSwal += `<span>Email : <b> ${email} </b></span><br> `;
  infoSwal += `<span>Position : <b> ${positionText} </b></span><br> `;
  infoSwal += `<span>Status : <b> ${statusUserText} </b></span>`;

  actText = `update ` + value + ``;
  if (value == 'recover') actText = value;
  Swal.fire({
    title: 'Hold on!',
    html: `Are you sure to ` + actText + ` this user? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes['b7-clr-org-1'],
    cancelButtonColor: colorThemes['b7-clr-blu-2'],
    confirmButtonText: 'Yes!',
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, update this!',
    confirmButtonAriaLabel: 'Update!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: url,
        type: 'POST',
        dataType: 'JSON',
        data: dataPost,
        beforeSend: function () {
          openLoader();
        },
        success: function (data) {
          if (data.includes('exist')) {
            el.closest('.user-detail').querySelector('.username-field').value = usernameBefore;
            el.closest('.user-detail').querySelector('.email-field').value = emailBefore;

            Swal.fire(
              'Hold on!',
              `${firstUppercase(
                data.replace('exist-', '')
              )} already exist! Please change another ${firstUppercase(
                data.replace('exist-', '')
              )}.`,
              'info'
            );
            statusAddUser = false;
          } else if (data == 'success') {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully ` + actText + ` this user! <br><br>` + infoSwal,
            });

            el.closest('.user-detail')
              .querySelector('.username-field')
              .setAttribute('data-username', username);
            el.closest('.user-detail')
              .querySelector('.email-field')
              .setAttribute('data-email', email);
            document.querySelector('.group-button.active').click();
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to ` + actText + ` this user! <br><br>` + infoSwal,
            });
          }
        },
        complete: function () {
          closeLoader();
        },
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to ` + actText + ` this user! <br><br>` + infoSwal,
      });
    }
  });
}

// ADD NEW USER --ir
function addNewUser() {
  if (!checkPrivileged('insert', 'user_list')) return false;

  nameUser = document.getElementById('new-name-field').value;
  username = document.getElementById('new-username-field').value;
  email = document.getElementById('new-email-field').value;
  position = document.getElementById('new-position-field').value;
  positionText = document.getElementById('new-position-field');
  positionText = positionText.options[positionText.selectedIndex].text;

  if (!nameUser || !username || !email || !position || !positionText) {
    Swal.fire('Hold on!', 'Please input all field above!', 'info');
    return false;
  }

  infoSwal = `<span>User : <b> ${username} </b></span><br> `;
  infoSwal += `<span>Name : <b> ${nameUser} </b></span><br> `;
  infoSwal += `<span>Email : <b> ${email} </b></span><br> `;
  infoSwal += `<span>Position : <b> ${positionText} </b></span><br> `;

  statusAddUser = true;
  Swal.fire({
    title: 'Hold on!',
    html: `Are you sure to add this user? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    cancelButtonColor: colorThemes['b7-clr-org-1'],
    confirmButtonColor: colorThemes['b7-clr-blu-2'],
    confirmButtonText: 'Yes!',
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, add this user!',
    confirmButtonAriaLabel: 'Add!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'addUser',
        type: 'POST',
        dataType: 'JSON',
        data: {
          nameUser: nameUser,
          username: username,
          email: email,
          position: position,
          positionText: positionText,
        },
        beforeSend: function () {
          openLoader();
        },
        success: function (data) {
          if (data.includes('exist')) {
            Swal.fire(
              'Hold on!',
              `${firstUppercase(
                data.replace('exist-', '')
              )} already exist! Please change another ${firstUppercase(
                data.replace('exist-', '')
              )}.`,
              'info'
            );
            statusAddUser = false;
          } else if (data == 'success') {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully added this user! <br><br>` + infoSwal,
            });
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to added this user! <br><br>` + infoSwal,
            });
          }
        },
        complete: function () {
          closeLoader();
          if (statusAddUser) {
            closeModal();
            document
              .querySelector('#modal-add-user')
              .querySelectorAll('input, select, textarea')
              .forEach((field) => {
                field.value = '';
              });
            document.querySelector('.group-button.active').click();
          }
        },
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to update this user! <br><br>` + infoSwal,
      });
    }
  });
}

// ADD NEW GROUP --ir
function addNewGroup() {
  if (!checkPrivileged('insert', 'user_list')) return false;

  positionName = document.getElementById('new-group-field').value;

  if (!positionName) {
    Swal.fire('Hold on!', 'Please input group name first!', 'info');
    return false;
  }

  infoSwal = `<span>Group Name : <b> ${positionName} </b></span><br> `;

  Swal.fire({
    title: 'Hold on!',
    html: `Are you sure to add this group? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    cancelButtonColor: colorThemes['b7-clr-org-1'],
    confirmButtonColor: colorThemes['b7-clr-blu-2'],
    confirmButtonText: 'Yes!',
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, add this group!',
    confirmButtonAriaLabel: 'Add!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'addGroup',
        type: 'POST',
        dataType: 'JSON',
        data: {
          position_name: positionName,
        },
        beforeSend: function () {
          openLoader();
        },
        success: function (data) {
          if (data.includes('success')) {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully added this group! <br><br>` + infoSwal,
            });
            groupLists[data.split('|')[1]] = {
              position_id: data.split('|')[1],
              position_name: positionName,
            };
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to added this group! <br><br>` + infoSwal,
            });
          }
        },
        complete: function () {
          closeLoader();
          closeModal();
          setGroupPosition();
        },
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to update this group! <br><br>` + infoSwal,
      });
    }
  });
}

// RENAME SELECTED GROUP --ir
function renameGroup() {
  if (!checkPrivileged('update', 'user_list')) return false;

  positionId = document.querySelector('.group-button.active').value;
  oldPositionName = document.querySelector('.group-button.active').innerText;
  newPositionName = firstUppercase(document.getElementById('new-group-name-field').value);

  if (!newPositionName) {
    Swal.fire('Hold on!', 'Please input new group name first!', 'info');
    return false;
  }

  infoSwal = `<span>Old Group Name : <b> ${oldPositionName} </b></span><br> `;
  infoSwal += `<span>New Group Name : <b> ${newPositionName} </b></span><br> `;

  Swal.fire({
    title: 'Hold on!',
    html: `Are you sure to rename this group? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    cancelButtonColor: colorThemes['b7-clr-org-1'],
    confirmButtonColor: colorThemes['b7-clr-blu-2'],
    confirmButtonText: 'Yes!',
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, rename this group!',
    confirmButtonAriaLabel: 'Add!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'renameGroup',
        type: 'POST',
        dataType: 'JSON',
        data: {
          position_id: positionId,
          old_position_name: oldPositionName,
          new_position_name: newPositionName,
        },
        beforeSend: function () {
          openLoader();
        },
        success: function (data) {
          if (data.includes('success')) {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully rename this group! <br><br>` + infoSwal,
            });
            groupLists[positionId] = {
              position_id: positionId,
              position_name: newPositionName,
            };
            document.querySelector('.group-button.active').innerText = newPositionName;
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to rename this group! <br><br>` + infoSwal,
            });
          }
        },
        complete: function () {
          closeLoader();
          closeModal();
          setGroupPosition();
        },
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to update this group! <br><br>` + infoSwal,
      });
    }
  });
}

// FUNCTION TO REMOVE SELECTED GROUP --ir
function removeUserGroup() {
  if (!checkPrivileged('delete', 'user_list')) return false;

  selectedGroup = document.querySelector('.group-button.active').value;
  selectedGroupName = document.querySelector('.group-button.active').innerText;

  if (selectedGroup == 'EP00') {
    Swal.fire('Hold on!', 'You cannot delete this group!', 'warning');
    return;
  }

  if (document.querySelectorAll('.user-card').length > 0) {
    Swal.fire(
      'Hold on!',
      'Please change users group first before remove current selected group.',
      'info'
    );
    return;
  }

  infoSwal = `<span>Group Name : <b> ${selectedGroupName} </b></span><br> `;

  Swal.fire({
    title: 'Hold on!',
    html: `Are you sure to delete this group? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    cancelButtonColor: colorThemes['b7-clr-org-1'],
    confirmButtonColor: colorThemes['b7-clr-blu-2'],
    confirmButtonText: 'Yes!',
    confirmButtonText: '<i class="fas fa-power-off"></i> Yes, delete this group!',
    confirmButtonAriaLabel: 'Add!',
    cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
    cancelButtonAriaLabel: 'Cancel',
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: 'deleteGroup',
        type: 'POST',
        dataType: 'JSON',
        data: {
          position_id: selectedGroup,
          position_name: selectedGroupName,
        },
        beforeSend: function () {
          openLoader();
        },
        success: function (data) {
          if (data == 'success') {
            Swal.fire({
              title: '<strong>Success</strong>',
              icon: 'success',
              html: `Successfully remove this group! <br><br>` + infoSwal,
            });
            delete groupLists[selectedGroup];
          } else {
            Swal.fire({
              title: '<strong>Hold on!</strong>',
              icon: 'warning',
              html: `Failed to remove this group! <br><br>` + infoSwal,
            });
          }
        },
        complete: function () {
          closeLoader();
          closeModal();
          setGroupPosition();
        },
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Cancelled!</strong>',
        icon: 'info',
        html: `Cancel to delete this group! <br><br>` + infoSwal,
      });
    }
  });
}
