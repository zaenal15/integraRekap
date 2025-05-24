modals = ["#modal-update-kategori-penilaian", "#modal-update-point-penilaian", "#modal-update-sub-penilaian","#modal-update-kategori-pengurangan"];
fillModalContent(modals);

generateSidebar();

async function getData() {
  let [mataLombaRes, pesertaRes] = await Promise.all([
    fetch('/loadLomba', { method: 'POST' }).then(res => res.json()),
    // fetch('/loadPeserta', { method: 'POST' }).then(res => res.json())
  ]);

  return {
    mataLomba: mataLombaRes.data ? Object.values(mataLombaRes.data) : [], // Jika data tidak ada, gunakan array kosong
    // peserta: pesertaRes.data ? Object.values(pesertaRes.data) : [] // Jika data tidak ada, gunakan array kosong
  };
}

async function generateSidebar() {
  let { mataLomba } = await getData();
  let lombaData = mataLomba;
  let container = document.getElementById("lomba-container");
  let groupedByKategori = {};

  // Kelompokkan lomba berdasarkan kategori
  lombaData.forEach(item => {
    if (!groupedByKategori[item.nama_kategori]) {
      groupedByKategori[item.nama_kategori] = [];
    }
    groupedByKategori[item.nama_kategori].push(item);
  });

  // Membuat tampilan sidebar berdasarkan kategori
  let sidebarHTML = '';
  for (let kategori in groupedByKategori) {
    // Mengganti spasi dengan tanda _ agar bisa menjadi kelas yang valid
    let kategoriClass = kategori.replace(/\s+/g, '_');

    // Tambahkan tombol untuk toggle kategori
    sidebarHTML += `
      <div class="kategori-header" onclick="toggleKategori('${kategoriClass}')">
        <span class="toggle-icon">+</span> ${kategori}
      </div>
      <div class="lomba-list ${kategoriClass}" style="display:block;">`; // Default tampil
    groupedByKategori[kategori].forEach(lomba => {
      sidebarHTML += `
        <div class="lomba-header" data-kategori-id="${lomba.kategori_id}" data-lomba-id="${lomba.lomba_id}" onclick="handleLombaHeaderClick(event)">
          <i class="bi bi-folder-fill"></i> <span>${lomba.nama_lomba}</span>
        </div>`;
    });
    sidebarHTML += `</div>`;
  }

  container.innerHTML = sidebarHTML;
}

async function handleLombaHeaderClick(event) {
  let lombaHeaders = document.getElementsByClassName('lomba-header');

  // Remove the 'active' class from all lomba headers
  for (let header of lombaHeaders) {
    header.classList.remove('active');
  }

  // Add the 'active' class to the clicked header
  event.currentTarget.classList.add('active');

  // Get the lomba ID from the clicked header
  let lombaId = event.currentTarget.getAttribute('data-lomba-id');

  // Await the showSubPoint function to finish loading the sub-points
  await showSubPoint(lombaId);

  // After the function completes, click the first category button
  let firstCategoryButton = document.querySelector(".btn-category-penilaian:first-child");
  if (firstCategoryButton) {
    firstCategoryButton.click();
  }
}

// Fungsi untuk toggle kategori
function toggleKategori(kategoriClass) {
  let kategoriDiv = document.querySelector(`.${kategoriClass}`);
  let toggleIcon = document.querySelector(`.${kategoriClass} .toggle-icon`);

  // Jika kategori terlihat, sembunyikan, jika tersembunyi, tampilkan
  if (kategoriDiv.style.display === "none") {
    kategoriDiv.style.display = "block";
    toggleIcon.textContent = "-";
  } else {
    kategoriDiv.style.display = "none";
    toggleIcon.textContent = "+";
  }
}

async function showSubPoint(lombaId) {
  try {
    lombaId = Number(document.querySelector('.lomba-header.active').getAttribute('data-lomba-id'))
    const formData = new FormData();
    formData.append('lomba_id', lombaId);

    // Memuat data SubPoint menggunakan POST
    const response = await fetch('/loadKategoriPenilaian', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    const kategoripenilaianLists = data.data;

    const detailFormulirPenilaian = document.getElementById('detail-formulir-penilaian');

    if (kategoripenilaianLists.length > 0) {
      console.log('kategoripenilaianList', kategoripenilaianLists);

      detailFormulirPenilaian.innerHTML = `
        <section id="header-formulir-penilaian"></section>
        <section id="wrap-sub-point-content"></section>
      `;

      const headerFormulirPenilaian = document.getElementById('header-formulir-penilaian');
      headerFormulirPenilaian.innerHTML = `
        <section id="wrap-btn-kaegori-penilaian"></section>
      `;

      // Loop through kategoripenilaianLists and create buttons for each category
      const wrapBtnKaegoriPenilaian = document.getElementById('wrap-btn-kaegori-penilaian');
      kategoripenilaianLists.forEach(kategori => {
        wrapBtnKaegoriPenilaian.innerHTML += `
          <button class="btn-category-penilaian" data-id="${kategori.kategori_id}" data-category="${kategori.nama_kategori}">
            <i class="icon-menu bi bi-file-earmark-text-fill"></i> ${kategori.nama_kategori}
          </button>
        `;
      });

      headerFormulirPenilaian.innerHTML += `
        <button onclick="updateKategoriPenilaian()" id="category-penilaian-list" class="btn-category-list">
          <i class="icon-menu bi bi-file-earmark-text-fill"></i> Kategori penilaian
        </button>
        <button onclick="showKategoriPengurangan()" id="category-pengurangan-penilaian-list" class="btn-category-list">
          <i class="icon-menu bi bi-file-earmark-text-fill"></i>Kategori Pengurangan 
        </button>
        <button onclick="updatePointPenilaian()" id="add-category-sub-nilai"> <i class="fa fa-plus"></i></button>
      `;

      const filterButtons = document.querySelectorAll(".btn-category-penilaian");
      filterButtons.forEach(button => {
        button.addEventListener("click", () => {
          // Remove active class from all buttons
          filterButtons.forEach(btn => btn.classList.remove("active"));

          // Add active class to the clicked button
          button.classList.add("active");

          // Get the selected category and filter the data
          const selectedCategory = button.getAttribute("data-category");
          filterCategories(selectedCategory);
        });
      });
    } else {
      detailFormulirPenilaian.innerHTML = `
        <section class="no-data-content">
          <img src="../../assets/img/no-data2.svg" alt="" style="width: 32%; margin: 0 auto;">
          <h3 style="font-size: 25px;">Kategori Penilaian Belum Dibuat</h3>
          <button onclick="updateKategoriPenilaian()" id="category-penilaian-list" class="btn-category-list"><i class="fa fa-plus"></i> Tambah Kategori penilaian</button>
        </section>
      `;
    }

    return 'ok';
  } catch (error) {
    console.error('Error:', error);
    return 'error';
  }
}

function createCategories(data) {
  const categoriesContainer = document.getElementById("wrap-sub-point-content");
  categoriesContainer.innerHTML = "";

  let globalIndex = 1; // Initialize a global index for all sub-points

  for (const categoryKey in data) {
    let contentSubPoint = "";
    const category = data[categoryKey];

    // Loop through sub-point list for each category
    console.log('category', category);
    category.sub_point_list.forEach(subPoint => {
      contentSubPoint += `<section class="box-sub-point">`;
      contentSubPoint += `
      <section data-id="${subPoint.kategori_sub_point_id}" data-kategori="${subPoint.nama_kategori}" class="header-sub-point">
        <span>${subPoint.nama_kategori}</span>
        <button onclick="deleteSubPointContent(this)" class="btn-delete-sub-point"> <i class="fa fa-trash"></i></button>
        <button onclick="editSubPointList(this)" class="btn-edit-sub-point"> <i class="fas fa-pencil-alt"></i></button>
      </section>`;

      contentSubPoint += ` <section class="sub-point-list">`;
      subPoint.sub_point_details.forEach(detail => {
        contentSubPoint += `<section class="sub-point-content" style="padding: 0.5em; border: 1px solid #d1d5db; border-radius: 5px;"> 
          <span>${globalIndex}. ${detail}</span>
        </section>`;
        globalIndex++; // Increment global index for each sub-point
      });

      contentSubPoint += `</section></section>`;
    });

    categoriesContainer.innerHTML += contentSubPoint;
  }
}


async function filterCategories(selectedCategory) {
  lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id')
  const formData = new FormData();
  formData.append('lomba_id', lombaId); 

  console.log('selectedCategory', selectedCategory)
  // Memuat data SubPoint menggunakan POST
  const response = await fetch('/loadSubPoint', {
    method: 'POST',
    body: formData
  });

  data = await response.json();
  data = data.data
  console.log('filteredData2', data)
  // Filter data based on selected category
  const filteredData = data.filter(item => item.nama_kategori === selectedCategory);

  const categories = {};

  // Grouping data by category and sub-point
  filteredData.forEach(item => {
    if (!categories[item.nama_kategori]) {
      categories[item.nama_kategori] = {}; // Create new category
    }

    if (!categories[item.nama_kategori][item.nama_kategori_sub_point]) {
      categories[item.nama_kategori][item.nama_kategori_sub_point] = [];
    }

    categories[item.nama_kategori][item.nama_kategori_sub_point].push({
      "kategori_sub_point_id": item.kategori_sub_point_id, // Include kategori_sub_point_id
      "nama_sub_point": item.nama_sub_point
    });
  });

  console.log('categories', categories);

  const resultData = {};

  // Format the result data as needed
  for (const category in categories) {
    resultData[category] = {
      "nama_kategori": category,
      "nama_lomba": "",
      "sub_point_list": []
    };

    // Iterate through subcategories
    for (const subCategory in categories[category]) {
      resultData[category].sub_point_list.push({
        "nama_kategori": subCategory,
        "sub_point_details": categories[category][subCategory].map(subItem => subItem.nama_sub_point),
        "kategori_sub_point_id": categories[category][subCategory][0].kategori_sub_point_id // Get the kategori_sub_point_id from the first item
      });
    }
  }

  console.log('filteredData', filteredData)
  console.log('resultData',resultData);
  createCategories(resultData);
}


async function updateKategoriPenilaian(value) {
  openModal(modals[0])
  setKategoriModal()
}

async function setKategoriModal() {
  const lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id');
  const formData = new FormData();
  formData.append('lomba_id', lombaId);

  const kategoripenilaian = await fetch('/loadKategoriPenilaian', {
    method: 'POST',
    body: formData
  });

  const data = await kategoripenilaian.json();
  const kategoriLombaLists = data.data;
  const kategoriLombaModal = document.getElementById('wrap-content-list-category');

  let kategoriLombaListsModal = ``;

  console.log('kategoriLombaLists', kategoriLombaLists);

  for (const item of kategoriLombaLists) {
    const isUtamaActive = item["set_nilai"] === "active" ? "active" : "";
    const isUmumActive = item["nilai_umum"] === "active" ? "active" : "";
    const isBandingActive = item["nilai_banding"] === "active" ? "active" : "";

    kategoriLombaListsModal += `
      <section category-id="${item["kategori_id"]}" class="box-category-content">
        <label>${item["nama_kategori"]}</label>
        <input category-id="${item["kategori_id"]}" value="${item["nama_kategori"]}" style="display: none;" type="text">
        <div class="jenis-nilai basic-flex">
          <button
            id="btn-nilai-utama"
            class="btn-tipe-nilai ${isUtamaActive}" 
            onclick="setNilaiKategori(this, 'utama', ${item["kategori_id"]}, '${item["nama_kategori"]}')">
            Utama
          </button>
          <button 
          id="btn-nilai-umum"
            class="btn-tipe-nilai ${isUmumActive}" 
            onclick="setNilaiKategori(this, 'umum', ${item["kategori_id"]}, '${item["nama_kategori"]}')">
            Umum
          </button>
          <button 
           id="btn-nilai-banding"
            class="btn-tipe-nilai ${isBandingActive}" 
            onclick="setNilaiKategori(this, 'banding', ${item["kategori_id"]}, '${item["nama_kategori"]}')">
            Banding
          </button>
        </div>
        <button id="edit-kategori-lomba-btn" onclick="updateKategoriLomba(this,'edit')" class="edit"><i class="fas fa-pencil-alt"></i></button>
        <button id="update-kategori-lomba-btn" onclick="updateKategoriLomba(this,'update')" class="edit"><i class='bx bxs-save'></i></button>
        <button class="delete" onclick="deleteKategori(this, ${lombaId})"><i class="fa fa-trash"></i></button>
      </section>
    `;
  }

  kategoriLombaModal.innerHTML = kategoriLombaListsModal;

  document.querySelectorAll('.btn-tipe-nilai').forEach(function (button) {
    button.addEventListener('click', function () {
      this.classList.toggle('active');
    });
  });
}


async function updateKategoriLomba(el, act) {
  // Mengambil nilai nama kategori dari input
  idlomba = Number(document.querySelector('.lomba-header.active').getAttribute('data-lomba-id')) 
  if (act == 'add') {
    idKategori = ''
    namaKategori = document.querySelector("#add-kategori-lomba-field").value;
    setNilai = 'active'
    if (!namaKategori) {
      Swal.fire(
        'Hold on!',
        'Please input category name!',
        'warning'
      );
      return false;
    }
  }

  if (act == "edit") {
    boxCategoryList = el.closest('.box-category-content')
    console.log('boxCategoryList', boxCategoryList)
    document.querySelectorAll('.box-category-content').forEach(box => {
      box.classList.remove('active')
    })
    boxCategoryList.classList.add('active')
  }

  if (act == "update") {
    boxCategoryList = el.closest('.box-category-content')
    idKategori = boxCategoryList.getAttribute('category-id')
    namaKategori = boxCategoryList.querySelector('input').value
    setNilai = 'active'
  }
  if (act == "setNilai") {
    boxCategoryList = el.closest('.box-category-content')
    idKategori = boxCategoryList.getAttribute('category-id')
    namaKategori = boxCategoryList.querySelector('label').textContent
    setNilai = 'active'
  }


  if (act == 'add' || act == 'update' || act == "setNilai") {
    let infoSwal = `<span>Nama Kategori : <b> ${namaKategori} </b></span><br>`;

    let iconSwal = `<i class="fa fa-plus"></i>`;

    Swal.fire({
      title: "Hold on!",
      html: `Are you sure to ` + act + ` this kategori lomba? <br><br>` + infoSwal,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: colorThemes["b7-clr-org-1"],
      cancelButtonColor: colorThemes["b7-clr-blu-2"],
      confirmButtonText: "Yes!",
      confirmButtonText: `${iconSwal} Yes, ${act} this!`,
      confirmButtonAriaLabel: 'Update!',
      cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
      cancelButtonAriaLabel: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: 'updateKategoriPenilaian', 
          type: 'POST',
          dataType: "JSON",
          data: {
            kategori_id: idKategori,
            lomba_id: idlomba,
            nama_kategori: namaKategori,
            set_nilai: setNilai,
            act: act,
          },
          beforeSend: function () {
            openLoader();
          },
          success: function (data) {
            if (data == "success") {
              Swal.fire({
                title: '<strong>Success</strong>',
                icon: 'success',
                html: `Successfully ${act} this kategori lomba! <br><br>` + infoSwal
              });
            } else {
              Swal.fire({
                title: '<strong>Hold on!</strong>',
                icon: 'warning',
                html: `Failed to ${act} this kategori lomba! <br><br>` + infoSwal
              });
            }
          },
          complete:async function () {
            closeLoader();
            setKategoriModal()
            await showSubPoint(idlomba) 
            document.querySelector(`.lomba-header.active`).click();
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: '<strong>Cancelled!</strong>',
          icon: 'info',
          html: `Cancel to ${act} this kategori lomba! <br><br>` + infoSwal
        });
      }
    });
  }

}

async function setNilaiKategori(el, tipeNilai, idKategori, namaKategori) {
  const wasActive = el.classList.contains('active');
  const intendedStatus = !wasActive; // intended action (true: aktifkan, false: nonaktifkan)
  const status = intendedStatus ? 'active' : 'inactive';

  const infoSwal = `<span>Nama Kategori: <b>${namaKategori}</b></span><br><span>Set Nilai: <b>${tipeNilai.toUpperCase()}</b> ➔ <b>${status.toUpperCase()}</b></span>`;
  const iconSwal = `<i class="fa fa-check"></i>`;

  const result = await Swal.fire({
    title: "Hold on!",
    html: `Are you sure you want to set nilai <b>${tipeNilai}</b> to <b>${status}</b>?<br><br>${infoSwal}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: `${iconSwal} Yes, set it!`,
    cancelButtonText: '<i class="fa fa-times"></i> Cancel',
  });

  if (result.isConfirmed) {
    $.ajax({
      url: 'updateNilaiKategori', // ganti sesuai endpoint
      type: 'POST',
      dataType: 'JSON',
      data: {
        act: 'update_nilai',
        kategori_id: idKategori,
        tipe_nilai: tipeNilai, // ini nanti server harus tau mapping ke kolom mana
        status: status,
      },
      beforeSend: function () {
        openLoader();
      },
      success: function (data) {
        if (data.result === "success") {
          Swal.fire({
            title: '<strong>Success</strong>',
            icon: 'success',
            html: `Successfully set <b>${tipeNilai}</b> to <b>${status}</b> for this category!`
          });
          // Toggle tombol jika success
          if (intendedStatus) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        } else {
          Swal.fire({
            title: '<strong>Failed!</strong>',
            icon: 'error',
            html: `Failed to set <b>${tipeNilai}</b> to <b>${status}</b> for this category!`
          });
        }
      },
      complete: async function () {
        closeLoader();
        setKategoriModal(); // reload ulang semua kategori
      }
    });
  } else {
    // Kalau batal, balikin tombol ke kondisi semula
    if (wasActive) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
    Swal.fire({
      title: '<strong>Cancelled!</strong>',
      icon: 'info',
      html: `Cancelled setting nilai for this category!`
    });
  }
}



function deleteKategori(el,lombaId) {
  boxCategoryList = el.closest('.box-category-content')
  id = boxCategoryList.getAttribute('category-id')
  namaKategori = boxCategoryList.querySelector('input').value

  // Menyusun info untuk ditampilkan di SweetAlert
  infoSwal = `<span>Kategori ID : <b> ${id} </b></span><br>`;
  infoSwal += `<span>Nama Kategori : <b> ${namaKategori} </b></span><br>`;

  // Menampilkan konfirmasi SweetAlert
  Swal.fire({
    title: "Perhatian!",
    html: `Apakah Anda yakin untuk menghapus kategori lomba ini? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: 'Ya, hapus kategori lomba ini!',
    cancelButtonText: '<i class="fa fa-times"></i> Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      // Kirim data ke server untuk menghapus kategori lomba
      $.ajax({
        url: 'deleteKategoriPenilaian',  // Ubah URL untuk menghapus kategori lomba
        type: 'POST',
        dataType: "JSON",
        data: {
          id: id,
          nama_kategori: namaKategori,
        },
        beforeSend: function () {
          openLoader(); // Tampilkan loader saat proses penghapusan
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Berhasil</strong>',
              icon: 'success',
              html: `Kategori lomba ini berhasil dihapus! <br><br>` + infoSwal
            });
          } else {
            Swal.fire({
              title: '<strong>Tunggu Sebentar!</strong>',
              icon: 'warning',
              html: `Gagal menghapus kategori lomba ini! <br><br>` + infoSwal
            });
          }
        },
        complete:async function () {
          setKategoriModal()
          await showSubPoint(idlomba) 
          document.querySelector(`.lomba-header.active`).click();
          closeLoader();
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Batalkan!</strong>',
        icon: 'info',
        html: `Proses hapus kategori lomba ini dibatalkan! <br><br>` + infoSwal
      });
    }
  });
}

async function updatePointPenilaian(value) {
  kategoriPenilaian = document.querySelector('.btn-category-penilaian.active').getAttribute('data-category')
  document.getElementById('kategori-penilaian-field').textContent = kategoriPenilaian
  openModal(modals[1])
}

async function updateKategoriSubPoint(el, act) {
  // Mengambil nilai nama kategori dari input
  console.log(' act', act)
  idlomba = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id')
  kategoriPenilaian = document.querySelector('.btn-category-penilaian.active').getAttribute('data-category')
  idKategoriPenilaian = document.querySelector('.btn-category-penilaian.active').getAttribute('data-id')
  idKategoriSubPoint = 0
  if (act == 'add') {
    idKategori = ''
    kategoriSubPoint = document.querySelector("#judul-point-penilaian-field").value;

    if (!kategoriSubPoint) {
      Swal.fire(
        'Tunggu Sebentar!',
        'Harap masukkan nama kategori!',
        'warning'
      );
      return false;
    }
  }

  if (act == "edit") {
    boxCategoryList = el.closest('.form-input')
    console.log('boxCategoryList', boxCategoryList)
    boxCategoryList.classList.remove('active')
    boxCategoryList.classList.add('active')
  }

  if (act == "update") {
    kategoriSubPoint = document.getElementById('judul-point-penilaian-header-field').value
    idKategoriSubPoint = Number(document.getElementById('judul-point-penilaian-header').getAttribute('data-id'))
    console.log('kategoriSubPoint', kategoriSubPoint)
    console.log('idKategoriSubPoint', idKategoriSubPoint)
  }

  if (act == 'add' || act == 'update') {
    let infoSwal = `<span>Nama Kategori : <b> ${kategoriSubPoint} </b></span><br>`;

    let iconSwal = `<i class="fa fa-plus"></i>`;

    Swal.fire({
      title: "Tunggu Sebentar!",
      html: `Apakah Anda yakin untuk ` + act + ` kategori lomba ini? <br><br>` + infoSwal,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: colorThemes["b7-clr-org-1"],
      cancelButtonColor: colorThemes["b7-clr-blu-2"],
      confirmButtonText: "Ya!",
      confirmButtonText: `${iconSwal} Ya, ${act} ini!`,
      confirmButtonAriaLabel: 'Perbarui!',
      cancelButtonText: '<i class="fa fa-times"></i> Batal.',
      cancelButtonAriaLabel: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: 'updateKategoriSubPoint',
          type: 'POST',
          dataType: "JSON",
          data: {
            kategori_sub_point_id: idKategoriSubPoint,
            kategori_id: idKategoriPenilaian,
            kategori_sub_point: kategoriSubPoint,
            act: act,
          },
          beforeSend: function () {
            openLoader();
          },
          success: function (data) {
            if (data == "success") {
              Swal.fire({
                title: '<strong>Berhasil</strong>',
                icon: 'success',
                html: `Berhasil ${act} kategori lomba ini! <br><br>` + infoSwal
              });
            } else {
              Swal.fire({
                title: '<strong>Perhatian!</strong>',
                icon: 'warning',
                html: `Gagal ${act} kategori lomba ini! <br><br>` + infoSwal
              });
            }
          },
          complete: async function () {
            closeLoader();
            await setKategoriModal()

            const response = await fetch('/loadIdSubPointKategoriLastUpdate');
            const data = await response.json();
            const dataIdKategoriSubPoint = data.data

            if (act == "add") {
              openModal(modals[2])
              document.getElementById('judul-point-penilaian-header').textContent = kategoriSubPoint
              document.getElementById('judul-ketegori-penilaian-header').textContent = kategoriPenilaian
              document.getElementById('judul-point-penilaian-header').setAttribute('data-id', dataIdKategoriSubPoint.kategori_sub_point_id)
              document.getElementById('judul-point-penilaian-header-field').value = kategoriSubPoint
              await showSubPoint(idlomba)
              console.log('kategoriSubPoint', kategoriSubPoint)
              document.querySelector(`.btn-category-penilaian[data-category="${kategoriPenilaian}"]`).click();
            }
            if (act == "update") {
              boxCategoryList.classList.remove('active')
              document.getElementById('judul-point-penilaian-header').textContent = document.getElementById('judul-point-penilaian-header-field').value
            }
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: '<strong>Cancelled!</strong>',
          icon: 'info',
          html: `Proses ${act} kategori lomba ini dibatalkan! <br><br>` + infoSwal
        });
      }
    });
  }
}

async function updateSubPointList(el, act) {
  // Mengambil nilai nama kategori dari input
  idlomba = Number(document.querySelector('.lomba-header.active').getAttribute('data-lomba-id'))
  idKategori = document.getElementById('judul-point-penilaian-header').getAttribute('data-id')

  if (act == 'add') {
    idSubPoint = 0
    namaSubPoint = document.querySelector("#add-sub-point-field").value;

    if (!namaSubPoint) {
      Swal.fire(
        'Tunggu Sebentar!',
        'Harap masukkan nama sub-point!',
        'warning'
      );
      return false;
    }
  }

  if (act == "edit") {
    boxCategoryList = el.closest('.box-category-content')
    console.log('boxCategoryList', boxCategoryList)
    document.querySelectorAll('.box-category-content').forEach(box => {
      box.classList.remove('active')
    })
    boxCategoryList.classList.add('active')

    return false
  }

  if (act == "update" || act == "delete") {
    boxCategoryList = el.closest('.box-category-content')
    idSubPoint = Number(boxCategoryList.getAttribute('data-id'))
    namaSubPoint = boxCategoryList.querySelector('input').value
  }

  // Langsung jalankan AJAX tanpa konfirmasi SweetAlert
  let infoSwal = `<span>Nama Sub Point : <b> ${namaSubPoint} </b></span><br>`;
  let iconSwal = `<i class="fa fa-plus"></i>`;

  $.ajax({
    url: 'updateSubPointList',
    type: 'POST',
    dataType: "JSON",
    data: {
      sub_point_id: idSubPoint,
      kategori_id: idKategori,
      nama_sub_point: namaSubPoint,
      act: act,
    },
    beforeSend: function () {
      openLoader();
    },
    success: function (data) {
      if (data == "success") {
        Swal.fire({
          title: '<strong>Berhasil</strong>',
          icon: 'success',
          html: `Berhasil ${act} sub point! <br><br>` + infoSwal,
          timer: 500, // menutup setelah 3 detik
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          title: '<strong>Perhatian!</strong>',
          icon: 'warning',
          html: `Gagal ${act} sub point! <br><br>` + infoSwal,
          timer: 1000, // menutup setelah 3 detik
          showConfirmButton: false
        });
      }
    },
    complete: async function () {
      closeLoader();
      setSubPointModal()
      kategoriPenilaian = document.getElementById('judul-ketegori-penilaian-header').textContent
      document.querySelector("#add-sub-point-field").value = ""
      await showSubPoint(idlomba)
      document.querySelector(`.btn-category-penilaian[data-category="${kategoriPenilaian}"]` ).click();
    }
  });
}

async function editSubPointList(el){
  openModal(modals[2])
  kategoriSubPoint = el.closest('.header-sub-point').getAttribute('data-kategori')
  kategoriPenilaian = document.querySelector('.btn-category-penilaian.active').getAttribute('data-category')
  idSubPointkategori = el.closest('.header-sub-point').getAttribute('data-id')
  
  document.getElementById('judul-point-penilaian-header').textContent = kategoriSubPoint
  document.getElementById('judul-point-penilaian-header-field').value = kategoriSubPoint
  document.getElementById('judul-ketegori-penilaian-header').textContent = kategoriPenilaian
  document.getElementById('judul-point-penilaian-header').setAttribute('data-id', idSubPointkategori)
  setSubPointModal()
}

async function setSubPointModal() {
  lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id')
  kategoriId = document.getElementById('judul-point-penilaian-header').getAttribute('data-id')
  namaKategori = document.getElementById('judul-ketegori-penilaian-header').textContent
  const formData = new FormData();
  formData.append('lomba_id', lombaId);

  // Memuat data SubPoint menggunakan POST
  const response = await fetch('/loadSubPointList', {
    method: 'POST',
    body: formData
  });

  console.log('namaKategori', namaKategori)
  console.log('kategoriId', Number(kategoriId))
  data = await response.json();
  data = data.data
  const dataSubPoint = data.filter(item => item.nama_kategori === namaKategori && item.kategori_sub_point_id === Number(kategoriId));
  console.log('data', data)
  console.log('dataSubPoint', dataSubPoint)
  const wrapSubPointListModal = document.getElementById('wrap-content-list-sub-point')
  let subPointListsModal = ``
  for (const key in dataSubPoint) {
    const item = dataSubPoint[key]
    subPointListsModal += ` 
    <section data-id="${item["sub_point_id"]}" class="box-category-content">
      <label>${item["nama_sub_point"]}</label>
      <input data-id="${item["sub_point_id"]}"  value="${item["nama_sub_point"]}" style="display: none;" type="text">
      <button id="edit-kategori-lomba-btn" onclick="updateSubPointList(this,'edit')" class="edit"><i class="fas fa-pencil-alt"></i></button>
      <button id="update-kategori-lomba-btn" onclick="updateSubPointList(this,'update')" class="edit"><i class='bx bxs-save'></i></button>
      <button  class="delete" onclick="updateSubPointList(this,'delete')"><i class="fas fa-trash-alt"></i></button>
    </section>`
  }
  wrapSubPointListModal.innerHTML = subPointListsModal
}

function deleteSubPointContent(el) {
  boxCategoryList = el.closest('.header-sub-point')
  lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id')
  kategoriPenilaian = document.querySelector('.btn-category-penilaian.active').getAttribute('data-category')
  id = boxCategoryList.getAttribute('data-id')
  namaKategori = boxCategoryList.getAttribute('data-kategori')

  // Menyusun info untuk ditampilkan di SweetAlert
  infoSwal = `<span>Kategori ID : <b> ${id} </b></span><br>`;
  infoSwal += `<span>Nama Kategori : <b> ${namaKategori} </b></span><br>`;

  // Menampilkan konfirmasi SweetAlert
  Swal.fire({
    title: "Perhatian!",
    html: `Apakah Anda yakin untuk menghapus kategori lomba ini? <br><br>` + infoSwal,
    icon: 'info',
    showCancelButton: true,
    confirmButtonColor: colorThemes["b7-clr-org-1"],
    cancelButtonColor: colorThemes["b7-clr-blu-2"],
    confirmButtonText: 'Ya, hapus kategori lomba ini!',
    cancelButtonText: '<i class="fa fa-times"></i> Batal',
  }).then((result) => {
    if (result.isConfirmed) {
      // Kirim data ke server untuk menghapus kategori lomba
      $.ajax({
        url: 'deleteSubPointContent',  // Ubah URL untuk menghapus kategori lomba
        type: 'POST',
        dataType: "JSON",
        data: {
          id: id,
          nama_kategori: namaKategori,
        },
        beforeSend: function () {
          openLoader(); // Tampilkan loader saat proses penghapusan
        },
        success: function (data) {
          if (data == "success") {
            Swal.fire({
              title: '<strong>Berhasil</strong>',
              icon: 'success',
              html: `Kategori lomba ini berhasil dihapus! <br><br>` + infoSwal
            });
          } else {
            Swal.fire({
              title: '<strong>Tunggu Sebentar!</strong>',
              icon: 'warning',
              html: `Gagal menghapus kategori lomba ini! <br><br>` + infoSwal
            });
          }
        },
        complete:async function () {
          await setKategoriModal()
          await showSubPoint(lombaId)
          document.querySelector(`.btn-category-penilaian[data-category="${kategoriPenilaian}"]`).click();
          closeLoader();
        }
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: '<strong>Batalkan!</strong>',
        icon: 'info',
        html: `Proses hapus kategori lomba ini dibatalkan! <br><br>` + infoSwal
      });
    }
  });
}

async function showKategoriPengurangan() {
  openModal('#modal-update-kategori-pengurangan')

  lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id')
  const formData = new FormData();
  formData.append('lomba_id', lombaId);
  // Memuat data kategori penilaian
  const kategoriPenilaianResponse = await fetch('/loadKategoriPenilaian', {
    method: 'POST',
    body: formData
  });

  const kategoriData = (await kategoriPenilaianResponse.json()).data;
  console.log('kategoriData', kategoriData)
  contentSubPoint = ``
  selectKategoriField = `<option value="">Pilih Kategori</option>`
  if(lombaId == 11){
    selectKategoriField += `<option data-id="0">Pengurangan Pasukan</option>`
  }
  kategoriData.forEach(item => {
    selectKategoriField += `<option data-id="${item.kategori_id}" value="${item.nama_kategori}">${item.nama_kategori}</option>`

    contentSubPoint += `<section class="box-sub-point">`;
    contentSubPoint += `
      <section  data-kategori="" class="header-sub-point header-sub-point">
        <span>${item.nama_kategori}</span>
      </section>
      <section data-id="${item.kategori_id}" class="keriteria-pengurangan-list sub-point-list">
      </section>
      `;
    contentSubPoint += `</section>`;
  });
  
  if(lombaId == 11){
    contentSubPoint += `<section class="box-sub-point">`;
    contentSubPoint += `
      <section  data-kategori="" class="header-sub-point header-sub-point">
        <span>Pengurangan Pasukan</span>
      </section>
      <section data-id="0" class="keriteria-pengurangan-list sub-point-list">
      </section>
      `;
    contentSubPoint += `</section>`;
  }
  
  document.getElementById('wrap-content-list-kategori-pengurangan').innerHTML = contentSubPoint;
  document.getElementById('kategori-pengurangan-nilai-field').innerHTML = selectKategoriField
  
  await setKategoriPenguranganPoint()
}

async function updateKategoriPenguranganPoint(el, act) {
  // Mengambil nilai kategori dari input
  let idKategoriPenilaian = document.querySelector('#kategori-pengurangan-nilai-field option:checked').getAttribute('data-id')
  let idKategoriPenguranganPoint = 0;
  let kriteriaPenguranganPoint = document.getElementById('kriteria-pengurangan-field').value

  if (act == 'add') {

    if (!kriteriaPenguranganPoint || idKategoriPenilaian === null || idKategoriPenilaian === undefined || idKategoriPenilaian === '') {
      Swal.fire(
        'Tunggu Sebentar!',
        'Harap masukkan nama kategori pengurangan point!',
        'warning'
      );
      return false;
    }

    wrapBoxKriteria = document.querySelector('#wrap-content-list-kategori-pengurangan .box-category-content.active')
    if (wrapBoxKriteria) {
      act = "update"
    }
  }

  if (act == "edit") {
    // Edit kategori pengurangan point
    let boxCategoryList = el.closest('.box-category-content');

    if (boxCategoryList.classList.contains('active')) {
      boxCategoryList.classList.remove('active');
      return false
    }

    wrapBoxKriteria = document.querySelector('#wrap-content-list-kategori-pengurangan .box-category-content.active')
    if (wrapBoxKriteria) {
      wrapBoxKriteria.classList.remove('active');
    }
    boxCategoryList.classList.add('active');

    kategoriId = boxCategoryList.getAttribute('kategori-id')
    document.getElementById('kriteria-pengurangan-field').value = boxCategoryList.getAttribute('value')
    const optionToSelect = document.querySelector(`#kategori-pengurangan-nilai-field option[data-id="${kategoriId}"]`);
    if (optionToSelect) {
      optionToSelect.selected = true;
    }
  }

  if (act == "delete") {
    boxCategoryList = el.closest('.box-category-content')
    idKategoriPenilaian = boxCategoryList.getAttribute('kategori-id')
    idKategoriPenguranganPoint = Number(boxCategoryList.getAttribute('data-id'))
  }

  if (act == "update") {
    wrapBoxKriteria = document.querySelector('#wrap-content-list-kategori-pengurangan .box-category-content.active')
    idKategoriPenilaian = wrapBoxKriteria.getAttribute('kategori-id')
    idKategoriPenguranganPoint = wrapBoxKriteria.getAttribute('data-id')
  }

  if (act == 'add' || act == 'update' || act == 'delete') {
    let infoSwal = `<span>Nama Kategori Pengurangan Point: <b> ${kriteriaPenguranganPoint} </b></span><br>`;
    let iconSwal = `<i class="fa fa-plus"></i>`;

    let swalTitle = `Apakah Anda yakin untuk ${act} kategori pengurangan point ini?`;
    let swalText = `Anda akan ${act} kategori pengurangan point berikut: <br><br>${infoSwal}`;

    if (act == 'delete') {
      swalTitle = `Apakah Anda yakin untuk menghapus kategori pengurangan point ini?`;
      swalText = `Anda akan menghapus kategori pengurangan point ini: <br><br>${infoSwal}`;
      iconSwal = `<i class="fa fa-trash"></i>`;
    }

    Swal.fire({
      title: "Tunggu Sebentar!",
      html: swalText,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: colorThemes["b7-clr-org-1"],
      cancelButtonColor: colorThemes["b7-clr-blu-2"],
      confirmButtonText: "Ya!",
      confirmButtonText: `${iconSwal} Ya, ${act} ini!`,
      confirmButtonAriaLabel: 'Perbarui!',
      cancelButtonText: '<i class="fa fa-times"></i> Batal.',
      cancelButtonAriaLabel: 'Batal',
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: 'updateKategoriPenguranganPoint', // URL endpoint yang diubah
          type: 'POST',
          dataType: "JSON",
          data: {
            id: idKategoriPenguranganPoint,
            kategori_id: idKategoriPenilaian,
            kriteria_point_pengurangan: kriteriaPenguranganPoint, // Sesuaikan dengan data yang diinginkan
            act: act,
          },
          beforeSend: function () {
            openLoader();
          },
          success: function (data) {
            if (data == "success") {
              Swal.fire({
                title: '<strong>Berhasil</strong>',
                icon: 'success',
                html: `Berhasil ${act} kategori pengurangan point ini! <br><br>` + infoSwal
              });
            } else {
              Swal.fire({
                title: '<strong>Perhatian!</strong>',
                icon: 'warning',
                html: `Gagal ${act} kategori pengurangan point ini! <br><br>` + infoSwal
              });
            }
          },
          complete: async function () {
            await setKategoriPenguranganPoint()
            closeLoader();
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        Swal.fire({
          title: '<strong>Cancelled!</strong>',
          icon: 'info',
          html: `Proses ${act} kategori pengurangan point ini dibatalkan! <br><br>` + infoSwal
        });
      }
    });
  }
}

async function setKategoriPenguranganPoint() {
  try {
    const lombaId = document.querySelector('.lomba-header.active').getAttribute('data-lomba-id');
    const formData = new FormData();
    formData.append('lomba_id', lombaId);

    // Ambil data kategori penilaian
    const kategoriPenilaianResponse = await fetch('/loadKategoriPenilaian', {
      method: 'POST',
      body: formData
    });
    const kategoriData = (await kategoriPenilaianResponse.json()).data;

    // Tambahkan manual kategori_id = 0 jika lombaId == 11
    if (lombaId === '11') {
      kategoriData.push({
        kategori_id: 0,
        nama_kategori: "Pengurangan Pasukan",
        nama_lomba: "Umum"
      });

      // Tambahkan section HTML jika belum ada
      const container = document.querySelector('#kategori-sub-point-container');
      if (!document.querySelector(`.keriteria-pengurangan-list[data-id="0"]`)) {
        const sectionHTML = `
          <section class="box-sub-point">
            <section class="header-sub-point header-sub-point">
              <span>Pengurangan Pasukan</span>
            </section>
            <section data-id="0" class="keriteria-pengurangan-list sub-point-list"></section>
          </section>
        `;
        container.insertAdjacentHTML('beforeend', sectionHTML);
      }
    }

    // Ambil data pengurangan point
    const kriteriaPenguranganResponse = await fetch('/loadKategoriPenguranganPoint', {
      method: 'POST',
      body: formData
    });
    const kriteriaPenguranganData = (await kriteriaPenguranganResponse.json()).data;

    console.log('Kategori Data:', kategoriData);
    console.log('Kriteria Pengurangan Data:', kriteriaPenguranganData);

    // Proses setiap kategori
    kategoriData.forEach(value => {
      let contentKriteria = '';

      const dataKriteriaList = kriteriaPenguranganData.filter(item => item.kategori_id == value.kategori_id);

      dataKriteriaList.forEach(item => {
        const itemKriteriaArr = item.kriteria_point_pengurangan.split('-').filter(val => val.trim() !== "");

        let itemContent = `
          <section value="${item.kriteria_point_pengurangan}" data-id="${item.id}" kategori-id="${item.kategori_id}" class="box-category-content">
            <section class="header-btn-kriteria">
              <button id="edit-kategori-lomba-btn" onclick="updateKategoriPenguranganPoint(this, 'edit')" class="edit"><i class="fas fa-pencil-alt"></i></button>
              <button class="delete" onclick="updateKategoriPenguranganPoint(this, 'delete')"><i class="fas fa-trash-alt"></i></button>
            </section>`;

        itemContent += itemKriteriaArr.map((val, index) => `<span style="display: block;">${index + 1}. ${val}</span>`).join('');
        itemContent += `</section>`;
        contentKriteria += itemContent;
      });

      const kategoriListElement = document.querySelector(`.keriteria-pengurangan-list[data-id="${value.kategori_id}"]`);
      if (kategoriListElement) {
        kategoriListElement.innerHTML = contentKriteria;
      }
    });

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

async function updateKategoriJuara(el, act) {
  // Mengambil nilai lomba ID dari elemen aktif
  idlomba = Number(document.querySelector('.lomba-header.active').getAttribute('data-lomba-id')) 

  // Kondisi untuk menambah kategori juara baru
  if (act == 'add') {
    idKategori = '';
    namaKategori = document.querySelector("#add-kategori-lomba-field").value;

    // Memastikan nama kategori diinputkan
    if (!namaKategori) {
      Swal.fire(
        'Hold on!',
        'Please input category name!',
        'warning'
      );
      return false;
    }
  }

  // Kondisi untuk mengedit kategori juara
  if (act == "edit") {
    boxCategoryList = el.closest('.box-category-content');
    console.log('boxCategoryList', boxCategoryList);

    document.querySelectorAll('.box-category-content').forEach(box => {
      box.classList.remove('active');
    });
    boxCategoryList.classList.add('active');
  }

  // Kondisi untuk memperbarui kategori juara
  if (act == "update") {
    boxCategoryList = el.closest('.box-category-content');
    idKategori = boxCategoryList.getAttribute('category-id');
    namaKategori = boxCategoryList.querySelector('input').value;
    setNilai = 'active';
  }

  // Kondisi untuk mengatur nilai kategori juara
  if (act == "setNilai") {
    boxCategoryList = el.closest('.box-category-content');
    idKategori = boxCategoryList.getAttribute('category-id');
    namaKategori = boxCategoryList.querySelector('label').textContent;
    setNilai = 'active';
  }

  // Konfirmasi apakah pengguna ingin menambahkan, memperbarui, atau mengatur nilai
  if (act == 'add' || act == 'update' || act == "setNilai") {
    let infoSwal = `<span>Nama Kategori : <b> ${namaKategori} </b></span><br>`;
    let iconSwal = `<i class="fa fa-plus"></i>`;

    // Menampilkan Swal untuk konfirmasi
    Swal.fire({
      title: "Hold on!",
      html: `Are you sure to ${act} this kategori juara? <br><br>` + infoSwal,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: colorThemes["b7-clr-org-1"],
      cancelButtonColor: colorThemes["b7-clr-blu-2"],
      confirmButtonText: "Yes!",
      confirmButtonText: `${iconSwal} Yes, ${act} this!`,
      confirmButtonAriaLabel: 'Update!',
      cancelButtonText: '<i class="fa fa-times"></i> Cancel.',
      cancelButtonAriaLabel: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        // Jika konfirmasi diterima, kirim data ke API
        $.ajax({
          url: 'updateKategoriJuara', // Ganti dengan endpoint untuk kategori juara
          type: 'POST',
          dataType: "JSON",
          data: {
            kategori_id: idKategori,
            lomba_id: idlomba,
            nama_kategori: namaKategori,
            set_nilai: setNilai,
            act: act,
          },
          beforeSend: function () {
            openLoader(); // Fungsi untuk membuka loader
          },
          success: function (data) {
            // Tampilkan hasil success atau failure
            if (data == "success") {
              Swal.fire({
                title: '<strong>Success</strong>',
                icon: 'success',
                html: `Successfully ${act} this kategori juara! <br><br>` + infoSwal
              });
            } else {
              Swal.fire({
                title: '<strong>Hold on!</strong>',
                icon: 'warning',
                html: `Failed to ${act} this kategori juara! <br><br>` + infoSwal
              });
            }
          },
          complete: async function () {
            closeLoader(); // Fungsi untuk menutup loader
            setKategoriModal(); // Mengatur modal kategori
            await showSubPoint(idlomba); // Menampilkan sub point setelah update
            document.querySelector(`.lomba-header.active`).click(); // Menutup panel lomba
          }
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Jika pembatalan dilakukan
        Swal.fire({
          title: '<strong>Cancelled!</strong>',
          icon: 'info',
          html: `Cancel to ${act} this kategori juara! <br><br>` + infoSwal
        });
      }
    });
  }
}

