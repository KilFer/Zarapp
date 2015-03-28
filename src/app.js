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
    if((sentidoLinea == "Avda Academia" && poste%2 === 0) || (sentidoLinea == "Mago De Oz" && poste%2 == 1)) {
        items.push({title:parada,subtitle:poste,data:proximosTranvias});
        console.log("El array introducido es de " + proximosTranvias.length);
    }
        
  }
  
  // Devuelve las lineas ordenadas en un array.
  return items;
};    

// Función que ordena el array de tranvías

var ordenarParadas = function(array,orden) {
    var posicion;
    var j = 0;
    var poste = 0;
    var actual = [];
    var i;
    if (orden == "a") { // Ordenar de manera ascendente (1 es el primero, 25 el último)
        while (j < array.length-1) { //Mientras J sea menor que el ArrayLength, queda recorrido por hacer.
            for (i = (array.length-1 -j); i >= 0; i--) { // Un recorrido completo para quedarse con el mas pesado de todos.
                if(poste < Number(array[i].subtitle)) {
                    poste = Number(array[i].subtitle); // en Poste, el número de poste que se ha quedado
                    posicion = i; //en posición, la posición del Array.
                }
            }
            //Se ha llegado al final completo. Sustituir el de posicion por el ultimo...
            actual = array[posicion];
            array[posicion] = array[(array.length-1) - j]; //Ha de tratar el último... sin tocar los ya tocados. J.
            array[(array.length-1) - j] = actual;
            j++;
            poste = 0;
        }
    }
    if (orden == "d") { // Ordenar de manera descendente (25 es el primero, 1 el último)
        poste = 9999;
        while (j < array.length-1) { //Mientras J sea menor que el ArrayLength, queda recorrido por hacer.
            for (i = (array.length-1)-j; i >= 0; i--) { // Un recorrido completo para quedarse con el mas ligero de todos.
                if(poste > Number(array[i].subtitle)) {
                    poste = Number(array[i].subtitle); // en Poste, el número de poste que se ha quedado
                    posicion = i; //en posición, la posición del Array.
                }
            }
            //Se ha llegado al final completo. Sustituir el de posicion por el ultimo...
            actual = array[posicion];
            array[posicion] = array[(array.length - 1) - j];
            array[(array.length - 1) - j] = actual;
            j++;
            poste = 9999;
        }
    }
    return array;
};


/* ================================================
======       EMPIEZA EL PROGRAMA EN SI       ======
================================================= */
// ¿En que sentido va a coger el tranvía?

var direcciones = [
  {title:"Hacia Mago de Oz", subtitle:"Linea 1", data: "Mago De Oz"},
  {title:"Hacia Avda Academia",subtitle:"Linea 1", data: "Avda Academia"}];

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
    if (direcciones[event.itemIndex].data == "Mago De Oz" || direcciones[event.itemIndex].data == "Avda Academia") {
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
            // Hay que ordenar las líneas  
            if (sentidoLinea == "Mago De Oz") {
                console.log("Ordenando de manera ascendente (Mago De Oz)");
                menuItems = ordenarParadas(menuItems,"a");
            }
            if (sentidoLinea == "Avda Academia") {
                console.log("Ordenando de manera descendente (Avda Academia)");
                menuItems = ordenarParadas(menuItems,"d");
            }
            
            // Comprobar que se han obtenido de manera correcta
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
            var info = " Proximo tranvia en: \n ";
            console.log("Numero de elementos que hay: " + menuItems[event.itemIndex].data.length);
            if (menuItems[event.itemIndex].data.length > 0) {
                for(var j = 0; j < menuItems[event.itemIndex].data.length; j++) {
                    info = info + menuItems[event.itemIndex].data[j] + "m,  ";                   
                }
            } else {
                info = "No hay tranvias.";
            }
        var detailCard = new UI.Card({
            title: menuItems[event.itemIndex].title,
            subtitle: "Dir. " + sentidoLinea,
            body: info + " \n \n Parada " + menuItems[event.itemIndex].subtitle,
            style: "small",
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