// Carregar Receita (PDF ou Imagem)
document.getElementById("upload-receita").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const canvasArea = document.getElementById("canvas-area");

  if (!file) return;

  const fileType = file.type;

  // Limpa a área primeiro
  canvasArea.innerHTML = "";

  // Se for PDF
  if (fileType === "application/pdf") {
    const fileReader = new FileReader();
    fileReader.onload = function () {
      const typedarray = new Uint8Array(this.result);
      pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
        pdf.getPage(1).then(function (page) {
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          canvasArea.appendChild(canvas);

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          page.render(renderContext);
        });
      });
    };
    fileReader.readAsArrayBuffer(file);
  }

  // Se for imagem
  else if (fileType.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.createElement("img");
      img.src = event.target.result;
      img.style.width = "100%";
      img.style.display = "block";
      img.style.position = "relative"; // necessário para evitar problemas de camadas
  
      // limpa canvas-area e reaplica imagem + assinatura
      const assinatura = assinaturaImg;
      canvasArea.innerHTML = "";
      canvasArea.appendChild(img);
      canvasArea.appendChild(assinatura);
    };
    reader.readAsDataURL(file);
  }
  
});

// Upload da Assinatura
document.getElementById("upload-assinatura").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const assinatura = document.getElementById("assinatura");
    assinatura.src = event.target.result;
    assinatura.style.display = "block";
  };
  reader.readAsDataURL(file);
});

// Arrastar Assinatura
let assinatura = document.getElementById("assinatura");
let isDragging = false;
let offsetX, offsetY;

assinatura.addEventListener("mousedown", function (e) {
  isDragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
});

document.addEventListener("mousemove", function (e) {
  if (isDragging) {
    const canvasRect = document.getElementById("canvas-area").getBoundingClientRect();
    assinatura.style.left = e.clientX - canvasRect.left - offsetX + "px";
    assinatura.style.top = e.clientY - canvasRect.top - offsetY + "px";
  }
});

document.addEventListener("mouseup", function () {
  isDragging = false;
});

// Gerar PDF Final
function gerarPDF() {
  html2canvas(document.getElementById("canvas-area")).then(function (canvas) {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("receita-assinada.pdf");
  });
}

const uploadReceita = document.getElementById('upload-receita');
const uploadAssinatura = document.getElementById('upload-assinatura');
const canvasArea = document.getElementById('canvas-area');
const assinaturaImg = document.getElementById('assinatura');

// Upload da receita (PDF ou imagem)
uploadReceita.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;

  if (file.type === 'application/pdf') {
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      const page = await pdf.getPage(1);

      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Limpar canvas-area mas manter a assinatura
      const assinatura = assinaturaImg; // já existe no DOM
      canvasArea.innerHTML = ''; // limpa tudo
      canvasArea.appendChild(canvas); // adiciona o novo canvas
      canvasArea.appendChild(assinatura); // reanexa a assinatura
    };

    fileReader.readAsArrayBuffer(file);
  }
});

// Upload da assinatura
uploadAssinatura.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    assinaturaImg.src = e.target.result;
    assinaturaImg.style.display = 'block';
  };
  reader.readAsDataURL(file);
});


// Arrastar assinatura com toque (mobile)
assinaturaImg.addEventListener("touchstart", function (e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = assinaturaImg.getBoundingClientRect();
      const canvasRect = canvasArea.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
      isDragging = true;
    }
  });
  
  document.addEventListener("touchmove", function (e) {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const canvasRect = canvasArea.getBoundingClientRect();
    assinaturaImg.style.left = touch.clientX - canvasRect.left - offsetX + "px";
    assinaturaImg.style.top = touch.clientY - canvasRect.top - offsetY + "px";
  });
  
  document.addEventListener("touchend", function () {
    isDragging = false;
  });
  
  // aparecer o nome se o aquivo foi escolhido ou n
  document.getElementById("upload-receita").addEventListener("change", function (e) {
    const fileName = e.target.files.length ? e.target.files[0].name : "Nenhum arquivo escolhido";
    document.getElementById("nome-receita").textContent = fileName;
  });
  
  document.getElementById("upload-assinatura").addEventListener("change", function (e) {
    const fileName = e.target.files.length ? e.target.files[0].name : "Nenhum arquivo escolhido";
    document.getElementById("nome-assinatura").textContent = fileName;
  });
  


  // modal

  let cropper;
const imgCropper = document.getElementById("img-cropper");
const modalCropper = document.getElementById("modal-cropper");
const btnCortar = document.getElementById("btn-cortar");

document.getElementById("upload-assinatura").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith("image/")) {
    alert("Selecione uma imagem válida.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    imgCropper.src = event.target.result;
    modalCropper.style.display = "flex";

    if (cropper) cropper.destroy();

    cropper = new Cropper(imgCropper, {
      aspectRatio: NaN,
      viewMode: 1,
      autoCropArea: 1,
    });
  };

  reader.readAsDataURL(file);
});

btnCortar.addEventListener("click", function () {
  const canvas = cropper.getCroppedCanvas();
  if (canvas) {
    assinaturaImg.src = canvas.toDataURL("image/png");
    assinaturaImg.style.display = "block";
  }

  modalCropper.style.display = "none";
  cropper.destroy();
});

function fecharCrop() {
  modalCropper.style.display = "none";
  if (cropper) cropper.destroy();
}
