sap.ui.define([
    "missolicitudes/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/library",
    "sap/m/Text",
    "sap/ui/core/library",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast"
],
function (BaseController, Controller, Fragment, Dialog, Button, mobileLibrary, Text, coreLibrary, JSONModel, BusyIndicator, MessageToast) {
    "use strict";
    var gPageSize = 10;
    var gFilttro = {
        nro_proyecto: "",
        nombre_proyecto: "",
        entrega_a: "",
        fecha_inicio: "",
        fecha_fin: "",
        id_estado: ""
    };
    return BaseController.extend("missolicitudes.controller.Main", {
        onInit: function () {
            

            //this._loadFiltro();
            //this._loadSolicitudData(gFilttro, 1, gPageSize);

            const orderRoute = this.getOwnerComponent().getRouter().getRoute("RouteMain");
            orderRoute.attachPatternMatched(this.onPatternMatched, this);

        },
        onPatternMatched: function() {
            // Inicializar el modelo de navegación
            var oNavModel = new JSONModel({
                firstPageBtnEnable: false,
                previousPageBtnEnable: false,
                nextPageBtnEnable: false,
                lastPageBtnEnable: false
            });
            this.getView().setModel(oNavModel, "NavModel");
            
            this._loadFiltro();
            this._loadSolicitudData(gFilttro, 1, gPageSize);
        },
        onAgregar: function(){
            console.log("Ir a Agregar");
            this.getOwnerComponent().getEventBus().publish("SolicitudChannel", "ActualizarNumeroSolicitud", {});
            this.getRouter().navTo("NuevaSolicitud");
        },
        onDetalle: function(){
            var _this = this;

            console.log("Ir a Detalle");
            var oTable = this.getView().byId("idSolicitudesTable");
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0 || aSelectedItems.length > 1) {
                //sap.m.MessageToast.show("Por favor, seleccione una solicitud");
                _this.openDialog("Alerta", "Debe seleccionar una solicitud.", "i");
                return;
            }

            var oSelectedItem = aSelectedItems[0];
            var oContext = oSelectedItem.getBindingContext("SolicitudesModel");
            var iIdSolicitud = oContext.getProperty("ID_SOLICITUD");

            console.log("Solicitud seleccionada: " + iIdSolicitud);
            const dataToPass = iIdSolicitud;
            this.getOwnerComponent().getModel("ModelDetalle").setProperty("/DetalleSolicitud", dataToPass, null, true);
            //this.getOwnerComponent().getEventBus().publish("DetalleChannel", "ActualizarInputs", {});
            this.getRouter().navTo("DetalleSolicitud", {
                id_solicitud: iIdSolicitud
            });

            //console.log("Ir a Detalle");
            //Si no hay registros seleccionados, mostrar alerta
            /*
            this.openDialog("Alerta", "Debe seleccionar una solicitud.", "i");
            */
            //this.getRouter().navTo("DetalleSolicitud");
        },
        onBuscar: function(){
            var _this = this;
            console.log("Buscando...");

            var requiredFields = [
                "dp_fecha_inicio", "dp_fecha_fin"
            ];
        
            var esValido = true;
            var dialogOpened = false;
            requiredFields.forEach(function(fieldId) {
                var oField = _this.getView().byId(fieldId);
                var value = oField.getValue ? oField.getValue() : oField.getSelectedKey();
                if (!value) {
                    // oField.setValueState(sap.ui.core.ValueState.Error);
                    //oField.setValueStateText("Este campo es requerido.");
                    if (!dialogOpened) {
                        _this.openDialog("Alerta", "Para realizar la búsqueda por fechas, debe ingresar la fecha de inicio y la fecha de fin.", "i");
                        dialogOpened = true;
                    }
                    esValido = false;
                } else {
                    oField.setValueState(sap.ui.core.ValueState.None);
                }
            });

            if(esValido){
                var vfecha_inicio = this.getView().byId("dp_fecha_inicio");
                var vfecha_fin = this.getView().byId("dp_fecha_fin");
    
                if (vfecha_fin.getDateValue() < vfecha_inicio.getDateValue()) {
                    vfecha_fin.setValueState(sap.ui.core.ValueState.Error);
                    vfecha_fin.setValueStateText("La fecha fin no puede ser menor a la fecha de inicio.");
                    return;
                } else {
                    vfecha_fin.setValueState(sap.ui.core.ValueState.None);
                }
    
                gFilttro.fecha_inicio = vfecha_inicio.getValue();
                gFilttro.fecha_fin = vfecha_fin.getValue();
                console.log("gFilttro", gFilttro);
                this._loadSolicitudData(gFilttro, 1, gPageSize);
            }
            
        },
        onNroProyectoChange: function (oEvent) {
            if(oEvent.getParameter("selectedItem")){
                var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                console.log('sSelectedKey: ', sSelectedKey);
                gFilttro.nro_proyecto = sSelectedKey;
            }else{
                console.log('sSelectedKey: null');
                gFilttro.nro_proyecto = "";
            }
        },
        onEntregaAChange: function (oEvent) {
            if(oEvent.getParameter("selectedItem")){
                var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                console.log('sSelectedKey: ', sSelectedKey);
                gFilttro.entrega_a = sSelectedKey;
            }else{
                console.log('sSelectedKey: null');
                gFilttro.entrega_a = "";
            }
        },
        onNombreProyectoChange: function (oEvent) {
            if(oEvent.getParameter("selectedItem")){
                var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                console.log('sSelectedKey: ', sSelectedKey);
                gFilttro.nombre_proyecto = sSelectedKey;
            }else{
                console.log('sSelectedKey: null');
                gFilttro.nombre_proyecto = "";
            }
        },
        onEstadoChange: function (oEvent) {
            if(oEvent.getParameter("selectedItem")){
                var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                console.log('sSelectedKey: ', sSelectedKey);
                gFilttro.id_estado = sSelectedKey;
            }else{
                console.log('sSelectedKey: null');
                gFilttro.id_estado = "";
            }
        },
        _loadSolicitudData: function (pFiltro, pPage, pSize) {
            var _url = this.getApiVSM() + 'api/mis-solicitud/v1/find';
            var _this = this;

            var queryPagination = {
                page: pPage,
                page_size: pSize
            }

            var queryParams = {
                filter: pFiltro,
                pagination: queryPagination
            }

            console.log('params: ', queryParams)

            $.ajax({
                url: _url,  // Asegúrate de que esta URL sea correcta
                type: 'POST',
                data: JSON.stringify(queryParams),  // Enviar datos como JSON
                contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                async: true,
                beforeSend: function () {
                    BusyIndicator.show(0);
                },
                success: function (data) {
                    if (data && data.SOLICITUD.length > 0) {
                        var oModel = new JSONModel({
                            SOLICITUD: data.SOLICITUD,
                            PAGINA_ACTUAL: pPage,
                            REGISTROS_TOTALES: data.REGISTROS_TOTALES,
                            PAGINAS_TOTALES: data.PAGINAS_TOTALES
                        });
                        _this.getView().setModel(oModel, "SolicitudesModel");
                        _this._updatePaginationButtons();
                    } else {
                        _this.openDialog("Alerta", "No se encontraron resultados para su búsqueda.", "i");
                        _this.getView().setModel(new JSONModel({ SOLICITUD: [] }), "SolicitudesModel");
                    }
                },
                error: function (error) {
                    sap.m.MessageToast.show("Ocurrió un error al cargar los datos.", {
                        duration: 3000, // Duración en milisegundos
                        width: "20em", // Ancho del Toast
                        my: "center center", // Posición del Toast
                        at: "center center"
                    });
                },
                complete: function () {
                    BusyIndicator.hide();
                }
            });
        },
        _loadFiltro: function(){
            var _url = this.getApiVSM() + 'api/mis-solicitud/v1/filter-combo';
            var _this = this;

            $.ajax({
                url: _url,  // Asegúrate de que esta URL sea correcta
                type: 'GET',
                contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                async: true,
                beforeSend: function () {
                    BusyIndicator.show(0);
                },
                success: function (data) {
                    if (data && data.FILTRO_ESTADO) {
                        _this.getView().setModel(new JSONModel({ FILTRO_PROYECTO_NRO: data.FILTRO_PROYECTO_NRO }), "listaNroProyecto");
                        _this.getView().setModel(new JSONModel({ FILTRO_PROYECTO_NOMBRE: data.FILTRO_PROYECTO_NOMBRE }), "listaNombreProyecto");
                        _this.getView().setModel(new JSONModel({ FILTRO_ENTREGA_A: data.FILTRO_ENTREGA_A }), "listaEntregarA");
                        _this.getView().setModel(new JSONModel({ FILTRO_ESTADO: data.FILTRO_ESTADO }), "listaEstado");
                        
                    } else {
                        
                        _this.getView().setModel(new JSONModel({ FILTRO_PROYECTO_NRO: [] }), "listaNroProyecto");
                        _this.getView().setModel(new JSONModel({ FILTRO_PROYECTO_NOMBRE: [] }), "listaNombreProyecto");
                        _this.getView().setModel(new JSONModel({ FILTRO_ENTREGA_A: [] }), "listaEntregarA");
                        _this.getView().setModel(new JSONModel({ FILTRO_ESTADO: [] }), "listaEstado");
                    }
                },
                error: function (error) {
                    sap.m.MessageToast.show("Ocurrió un error al cargar los datos.", {
                        duration: 3000, // Duración en milisegundos
                        width: "20em", // Ancho del Toast
                        my: "center center", // Posición del Toast
                        at: "center center"
                    });
                },
                complete: function () {
                    BusyIndicator.hide();
                }
            });
        },
        onFirstPress: function () {
            this._setPage(1);
        },
        onPreviousPress: function () {
            let currentPage = this.getView().getModel("SolicitudesModel").getProperty("/PAGINA_ACTUAL");
            if (currentPage > 1) {
                this._setPage(currentPage - 1);
            }
        },
        onNextPress: function () {
            let currentPage = this.getView().getModel("SolicitudesModel").getProperty("/PAGINA_ACTUAL");
            let totalPages = this.getView().getModel("SolicitudesModel").getProperty("/PAGINAS_TOTALES");
            if (currentPage < totalPages) {
                this._setPage(currentPage + 1);
            }
        },
        onLastPress: function () {
            let totalPages = this.getView().getModel("SolicitudesModel").getProperty("/PAGINAS_TOTALES");
            this._setPage(totalPages);
        },
        _setPage: function (page) {
            this._loadSolicitudData(gFilttro, page, gPageSize);
        },
        _updatePaginationButtons: function () {
            let currentPage = this.getView().getModel("SolicitudesModel").getProperty("/PAGINA_ACTUAL");
            let totalPages = this.getView().getModel("SolicitudesModel").getProperty("/PAGINAS_TOTALES");
            var oNavModel = this.getView().getModel("NavModel");

            oNavModel.setProperty("/firstPageBtnEnable", currentPage > 1);
            oNavModel.setProperty("/previousPageBtnEnable", currentPage > 1);
            oNavModel.setProperty("/nextPageBtnEnable", currentPage < totalPages);
            oNavModel.setProperty("/lastPageBtnEnable", currentPage < totalPages);
        }
    });
});
