angular.module('app', ['ng-file-model']);

var $dom = prism.$injector.get('ux-controls.services.$dom');



var paletteButton = {
  id: 'palette',
  caption: 'Palette By Image',
  desc: 'oh this is so cool',
  execute: function () {
    $dom.modal({
      scope:{

        imgWatcher: function(filush,imgUrl) {
          var image = document.getElementById('paletteFile').files[0];
          var img = document.createElement('img');
          img.crossOrigin = 'Anonymous';
          console.log({img});
          var colorThief = new ColorThief();
          var imgCycleW = function (src) {
            img.onload = function() {
              var colorsArray = colorThief.getPalette(img,8);

              var hexColors = colorsArray.map(function(x){
                var newColor = new Color(x[0],x[1],x[2]);

                return newColor.toHex();});

              var parentPalette = document.getElementById('colorsPreview');

              var previewPalette = parentPalette.childNodes[0];

              while (previewPalette) {
                console.log({previewPalette});
                parentPalette.removeChild(parentPalette.firstChild);
                previewPalette = parentPalette.childNodes[0];
              }

              hexColors.forEach(function(hex) {
                console.log('color');
                var viewHex = document.createElement('div');
                viewHex.className = 'hexDivs';
                parentPalette.appendChild(viewHex);
                viewHex.style.backgroundColor = hex;


              });
            };
            img.src = src;

          };


          if (!imgUrl) {
            var reader  = new FileReader();
            reader.onload = function(e) {
              imgCycleW(e.target.result);
            };

            reader.readAsDataURL(image);
          } else {
            imgCycleW(imgUrl);
          }


        },
        postPalette: function(name,imgUrl) {

          var colorThief = new ColorThief();
          var $http = prism.$injector.get('$http');
          var image = document.getElementById('paletteFile').files[0];
          if (!name || (!imgUrl && !image)) {
            if (!name ) {
              document.getElementById('noName').className = 'noImage';
              setTimeout(function(){
                document.getElementById('noName').className = 'invisible';},2000);
            } else {
            document.getElementById('noImageError').className = 'noImage';
            setTimeout(function(){
              document.getElementById('noImageError').className = 'invisible';},2000);
            }

          } else {

            var imgCycle = function (src) {
              var img = document.createElement('img');
              img.crossOrigin = 'Anonymous';

              img.onload = function() {

                var colorsArray = colorThief.getPalette(img,8);

                var hexColors = colorsArray
                .map(function(x){
                  var newColor = new Color(x[0],x[1],x[2]);

                  return newColor.toHex();});
                var paletteObj = {'name': name, 'colors': hexColors,  'isDefault': false, 'sortOrder': 0, 'systemDefault': true};

                $http({
                  method: 'POST',
                  url: 'http://localhost:8081/api/palettes',
                  data: paletteObj
                }).then(function successCallback(response) {
                  return response;
                }, function errorCallback(response) {
                  return response;
                });
                var dashId = prism.activeDashboard.oid;
                var paletteObjForPatch = {'colors': hexColors,  'name': name, 'isDefault': false, 'sortOrder': 0};
                var updateDashPalette = {'style' : {'name' : name, 'palette' : paletteObjForPatch}};

                $http({
                  method: 'PATCH',
                  url: 'http://localhost:8081/api/v1/dashboards/'+dashId,
                  data: updateDashPalette
                }).then(function successCallback(response) {

                  // here i should put the palette changes in the client
                  var redrawWidget = function (palette) {
                    prism.activeDashboard.style.setPalette(palette, true);
                    prism.activeDashboard.$dashboard.updateDashboard(prism.activeDashboard, 'style');

                    // update all widgets, because their colors have changed

                    prism.activeDashboard.widgets.toArray()
                    .forEach(function (widget) {
                      prism.activeDashboard.$dashboard.updateWidget(widget);
                    });
                    prism.activeDashboard.redraw();
                    if (prism.appstate === 'dashboard' && $$get(prism, 'dashboard.widgets.length') === 0) {
                      prism.$ngscope.$root.$broadcast('newWidgetRedraw');
                    }
                };

                  redrawWidget(paletteObj);
                  window.location.reload();
                  return response;
                }, function errorCallback(response) {
                  return response;
                });



              };
              img.src = src;

            };


            if (imgUrl) {
              /// put here the link cross if

              imgCycle(imgUrl);
            } else {

            var reader  = new FileReader();
            reader.onload = function(e) {
              imgCycle(e.target.result);

            };

              reader.readAsDataURL(image);
          }

          }

          },

      },
      templateUrl: '/plugins/palette-plugin/popupHtml.html',
    });
  },
  title: 'Palette By Image!',
  tooltip: 'Create a palette by image colors',
};

prism.on('beforemenu',function (event, args) {
  if (args.settings.name == 'dashboard') {
    args.settings.items.push(paletteButton);
  }

});
