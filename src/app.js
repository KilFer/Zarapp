// Version 0.8

var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var sentidoLinea;

// Función que obtiene las lineas de autobús

var lineastram = function(data){
  var items = [];
  console.log("Ha llegado hasta aqui");
  for(var i = 0; i < data.totalCount; i++){
    var linea = data.result[i];
    var poste = linea.id;
    console.log("Saca el ID de Result. Linea:" + linea);
    var parada = linea.title;
    console.log("Parada:" + parada);
    var proximosTranvias = [];
    // Siguen circulando los tranvias? Entonces hay destinos...
    if(linea.destinos){
    for (var j = 0; j < linea.destinos.length; j++){
        proximosTranvias.push(linea.destinos[j].minutos);
        console.log("Siguiente tranvia en: " + proximosTranvias + "m");
    }}
    
    //¿Es valida, segun la direccion de la linea?
    if((sentidoLinea == "AvdaAcademia" && poste%2 === 0) || (sentidoLinea == "MagoDeOz" && poste%2 == 1)) {
        items.push({title:parada,subtitle:poste,data:proximosTranvias});
        console.log("El array introducido es de " + proximosTranvias.length);
    }
        
  }
  
  // Devuelve las lineas ordenadas en un array.
  return items;
};

/* ================================================
======       EMPIEZA EL PROGRAMA EN SI       ======
================================================= */
// ¿En que sentido va a coger el tranvía?

var direcciones = [
  {title:"Hacia Mago de Oz", subtitle:"Linea 1", data: "MagoDeOz"},
  {title:"Hacia Avda Academia",subtitle:"Linea 1", data: "AvdaAcademia"}];

var menuInicio = new UI.Menu({
  sections: [{
    title: 'Lineas de Tranvía',
    items: direcciones,
  }]
});
menuInicio.show();

// Ha seleccionado una opción. ¿Que hacer?

menuInicio.on('select', function(event) {
    
    // SI SELECCIONA LINEA 1 DE TRANVÍA
    if (direcciones[event.itemIndex].data == "MagoDeOz" || direcciones[event.itemIndex].data == "AvdaAcademia") {
        sentidoLinea = direcciones[event.itemIndex].data; // en SentidoLinea está la dirección guardada. Ahora, hay que filtrar.
        
        // Muestra una ventana de carga mientras espera a que carguen los datos.
        var ventanaCarga = new UI.Window();
    
        // Texto para avisar al usuario
        var text = new UI.Text({
          position: new Vector2(0, 0),
          size: new Vector2(144, 168),
          text:'Descargando las paradas',
          font:'GOTHIC_18_BOLD',
          color:'black',
          textOverflow:'wrap',
          textAlign:'center',
          backgroundColor:'white'
        });
    
        // Se añade el texto y se muestra.
        ventanaCarga.add(text);
        ventanaCarga.show();
    
        // Obtengamos los datos.
    
        // URL para obtener las lineas
        var URL = 'http://www.zaragoza.es/api/recurso/urbanismo-infraestructuras/tranvia.json';
    
        ajax(
          {
            url: URL,
            type:'json'
          },
          function(data) {
            // Crear un array con las lineas de autobús
            var menuItems = lineastram(data);
            // Comprobar que se han obtenido de manera correcta
            for(var i = 0; i < menuItems.length; i++) {
              console.log(menuItems[i].title);
          }
              // Se muestra las opciones de bus
          var menuTram = new UI.Menu({
          sections: [{
            title: 'Paradas del tranvia',
            items: menuItems
          }]
        });
              // Se muestra el menú y se esconde la ventana de carga
        menuTram.show();
        ventanaCarga.hide();
    
        //Mostradas las paradas... ¿Y si ahora pulso? Información de la parada.
              
        menuTram.on('select', function(event) {
            var info = "Proximo tranvia en ";
            console.log("Numero de elementos que hay: " + menuItems[event.itemIndex].data.length);
            if (menuItems[event.itemIndex].data.length > 0) {
                for(var j = 0; j < menuItems[event.itemIndex].data.length; j++) {
                    info = info + menuItems[event.itemIndex].data[j] + "m, ";                   
                }
            } else {
                info = "No hay tranvias.";
            }
        var detailCard = new UI.Card({
            title: menuItems[event.itemIndex].title,
            subtitle: "Parada " + menuItems[event.itemIndex].subtitle,
            body: info
              });        
            detailCard.show();
            
                  
             });
        },
          function(error) {
            console.log('Download failed: ' + error);
          }
        );
    }
    // HASTA AQUI, SI HA SELECCIONADO LINEA 1 DE TRANVIA.
});