// Referências dos elementos
const uploadReceita = document.getElementById('upload-receita');
const uploadAssinatura = document.getElementById('upload-assinatura');
const canvasArea = document.getElementById('canvas-area');
const assinaturaImg = document.getElementById('assinatura');
const imgCropper = document.getElementById("img-cropper");
const modalCropper = document.getElementById("modal-cropper");
const btnCortar = document.getElementById("btn-cortar");

let isDragging = false;
let offsetX, offsetY;
let cropper;

// --------- Carregar Receita (PDF ou Imagem) ---------
uploadReceita.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;

  // Mostrar nome do arquivo selecionado
  document.getElementById("nome-receita").textContent = file.name || "Nenhum arquivo escolhido";

  if (file.type === "application/pdf") {
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

      const renderContext = { canvasContext: context, viewport: viewport };
      await page.render(renderContext).promise;

      // Limpar canvas-area mas manter a assinatura
      canvasArea.innerHTML = '';
      canvasArea.appendChild(canvas);
      canvasArea.appendChild(assinaturaImg);
    };

    fileReader.readAsArrayBuffer(file);

  } else if (file.type.startsWith("image/")) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = document.createElement("img");
      img.src = event.target.result;
      img.style.width = "100%";
      img.style.display = "block";
      img.style.position = "relative";

      // Limpar canvas-area e adicionar imagem + assinatura
      canvasArea.innerHTML = "";
      canvasArea.appendChild(img);
      canvasArea.appendChild(assinaturaImg);
    };

    reader.readAsDataURL(file);
  }
});

// --------- Upload da Assinatura ---------
uploadAssinatura.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  // Mostrar nome do arquivo selecionado
  document.getElementById("nome-assinatura").textContent = file.name || "Nenhum arquivo escolhido";

  const reader = new FileReader();

  reader.onload = function (e) {
    assinaturaImg.src = e.target.result;
    assinaturaImg.style.display = 'block';
  };

  reader.readAsDataURL(file);
});

// --------- Arrastar Assinatura (mouse) ---------
assinaturaImg.addEventListener("mousedown", function (e) {
  isDragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
});

document.addEventListener("mousemove", function (e) {
  if (isDragging) {
    const canvasRect = canvasArea.getBoundingClientRect();
    assinaturaImg.style.left = e.clientX - canvasRect.left - offsetX + "px";
    assinaturaImg.style.top = e.clientY - canvasRect.top - offsetY + "px";
  }
});

document.addEventListener("mouseup", function () {
  isDragging = false;
});

// --------- Arrastar Assinatura (toque mobile) ---------
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

// --------- Gerar PDF Final ---------
function gerarPDF() {
  html2canvas(canvasArea).then(function (canvas) {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("receita-assinada.pdf");
  });
}

// --------- Modal e Cropper para Assinatura ---------
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

// Variáveis para controle de múltiplas páginas
let pdfDoc = null;
let currentPage = 1;
let totalPages = 0;

// Botões de navegação
const btnAnterior = document.getElementById('btn-anterior');
const btnProximo = document.getElementById('btn-proximo');
const paginaInfo = document.getElementById('pagina-info');

// Função para renderizar a página atual do PDF
async function renderPage(pageNum) {
  if (!pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: context,
    viewport: viewport
  };
  await page.render(renderContext).promise;

  // Limpar e colocar só a página atual no canvasArea, junto com a assinatura
  canvasArea.innerHTML = '';
  canvasArea.appendChild(canvas);
  canvasArea.appendChild(assinaturaImg);

  // Atualiza o texto da página
  paginaInfo.textContent = `Página ${pageNum} / ${totalPages}`;
}

// Eventos dos botões de navegação
btnAnterior.addEventListener('click', () => {
  if (currentPage <= 1) return;
  currentPage--;
  renderPage(currentPage);
});

btnProximo.addEventListener('click', () => {
  if (currentPage >= totalPages) return;
  currentPage++;
  renderPage(currentPage);
});

// Atualize o listener de upload para PDF para carregar todas as páginas (adicione dentro do seu listener)
uploadReceita.addEventListener('change', async function () {
  const file = this.files[0];
  if (!file) return;

  if (file.type === "application/pdf") {
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result);
      pdfDoc = await pdfjsLib.getDocument(typedarray).promise;
      totalPages = pdfDoc.numPages;
      currentPage = 1;
      await renderPage(currentPage);
    };

    fileReader.readAsArrayBuffer(file);
  }
});
