window.addEventListener('DOMContentLoaded', function () {
    var image = document.getElementById('image');
    var croppedPlaceholderImage = document.getElementById('croppedImage');
    var input = document.getElementById('imageInput');
    var uploadButton = document.getElementById('uploadButton');
    var cropButton = document.getElementById('cropButton');
    var rotateButton = document.getElementById('rotateButton');
    var flipButton = document.getElementById('flipButton');
    var toggleModeButton = document.getElementById('toggleModeButton');
    var downloadButton = document.getElementById('downloadButton');
    var clearButton = document.getElementById('clearButton');
    var gallery = document.getElementById('gallery');
    var croppedGallery = document.getElementById('croppedGallery');
    var aspectRatioButtons = document.querySelectorAll('#aspectRatioButtons button');
    var cropper;
    var currentFileIndex = 0;
    var files = []; 
    var placeholderSrc = image.src; 
    var croppedImages = []; 
    var croppedPlaceholderSrc = croppedPlaceholderImage.src;
    var isMoveMode = false; 

    downloadButton.addEventListener('click', downloadCroppedImages);
    clearButton.addEventListener('click', clearAll);

    window.addEventListener('beforeunload', function (event) {
        if (croppedImages.length > 0) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes, do you want to quit?';
        }
    });

    function initializeCropper(aspectRatio) {
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(image, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            ready: function () {
                updateCroppedImage();
            },
            crop: function () {
                updateCroppedImage();
            }
        });
    }

    function updateCroppedImage() {
        if (cropper) {
            var canvas = cropper.getCroppedCanvas();
            if (canvas) {
                var previewContainer = document.getElementById('croppedContainer');
                var containerWidth = previewContainer.clientWidth;
                var containerHeight = previewContainer.clientHeight;
                var aspectRatio = canvas.width / canvas.height;
                
                var scaleWidth, scaleHeight;

                if (aspectRatio > 1) {
                    scaleWidth = containerWidth;
                    scaleHeight = containerWidth / aspectRatio;
                } else {
                    scaleHeight = containerHeight;
                    scaleWidth = containerHeight * aspectRatio;
                }

                if (scaleWidth > containerWidth) {
                    scaleWidth = containerWidth;
                    scaleHeight = containerWidth / aspectRatio;
                }

                if (scaleHeight > containerHeight) {
                    scaleHeight = containerHeight;
                    scaleWidth = containerHeight * aspectRatio;
                }

                var scaledCanvas = document.createElement('canvas');
                scaledCanvas.width = scaleWidth;
                scaledCanvas.height = scaleHeight;
                var ctx = scaledCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0, scaleWidth, scaleHeight);

                var imgElement = document.createElement('img');
                imgElement.src = scaledCanvas.toDataURL('image/png');
                previewContainer.innerHTML = '';
                previewContainer.appendChild(imgElement);
            }
        }
    }

    function loadImageToGallery(file, index) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var imgElement = document.createElement('img');
            imgElement.src = e.target.result;
            imgElement.dataset.index = index;
            imgElement.dataset.format = file.type; 
            imgElement.addEventListener('click', function () {
                image.src = e.target.result;
                initializeCropper(1);
                currentFileIndex = index; 
            });
            var galleryItem = document.createElement('div');
            galleryItem.classList.add('gallery-item');
            galleryItem.appendChild(imgElement);
            gallery.appendChild(galleryItem);
        };
        reader.readAsDataURL(file);
    }

    input.addEventListener('change', function (e) {
        var newFiles = e.target.files;
        for (var i = 0; i < newFiles.length; i++) {
            files.push(newFiles[i]);
            loadImageToGallery(newFiles[i], files.length - 1);
        }
    });

    uploadButton.addEventListener('click', function () {
        input.click(); // Trigger file input click
    });

    aspectRatioButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var aspectRatio = eval(this.dataset.aspectRatio);
            if (cropper) {
                cropper.setAspectRatio(aspectRatio);
            } else {
                initializeCropper(aspectRatio);
            }
        });
    });

    cropButton.addEventListener('click', function () {
        if (cropper) {
            var canvas = cropper.getCroppedCanvas();
            if (canvas) {
                var imgElement = document.createElement('img');
                var format = files[currentFileIndex].type.split('/')[1]; 
                var dataUrl = canvas.toDataURL('image/' + format);
                imgElement.src = dataUrl;
                croppedImages.push({ dataUrl: dataUrl, format: format }); 

                var galleryItem = document.createElement('div');
                galleryItem.classList.add('cropped-gallery-item');
                galleryItem.appendChild(imgElement);
                croppedGallery.appendChild(galleryItem);

                downloadButton.style.display = 'block'; 
                clearButton.style.display = 'block'; 
            }
        }
    });

    rotateButton.addEventListener('click', function () {
        if (cropper) {
            cropper.rotate(90); 
        }
    });

    var isFlipped = false;
    flipButton.addEventListener('click', function () {
        if (cropper) {
            cropper.scaleX(isFlipped ? 1 : -1); 
            isFlipped = !isFlipped;
        }
    });

    toggleModeButton.addEventListener('click', function () {
        if (cropper) {
            isMoveMode = !isMoveMode;
            cropper.setDragMode(isMoveMode ? 'move' : 'crop');
        }
    });

    function downloadCroppedImages() {
        var zip = new JSZip();
        croppedImages.forEach(function (image, index) {
            var imgData = image.dataUrl.split(',')[1];
            zip.file('cropped_image_' + (index + 1) + '.' + image.format, imgData, { base64: true });
        });
        zip.generateAsync({ type: 'blob' }).then(function (content) {
            saveAs(content, 'cropped_images.zip');
        });
    }

    function clearAll() {
        gallery.innerHTML = '';
        croppedGallery.innerHTML = '';
        croppedImages = [];
        files = [];
        image.src = placeholderSrc;
        croppedPlaceholderImage.src = croppedPlaceholderSrc;
        downloadButton.style.display = 'none';
        clearButton.style.display = 'none';
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }
});
