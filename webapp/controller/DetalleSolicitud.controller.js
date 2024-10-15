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
        var nroSolicitud = 0;
        var gPageSize = 100;
        const USUARIO_SISTEMA = "JRIVAS";
        var detalleEliminado = [];

        return BaseController.extend("missolicitudes.controller.DetalleSolicitud", {
            formatQuantityAtendida: function(iCantidadAtendida) {
                return iCantidadAtendida === 0 ? "-" : iCantidadAtendida;
            },
            onInit: function () {
                //this.toggleButtonsEdit(false);
                const orderRoute = this.getOwnerComponent().getRouter().getRoute("DetalleSolicitud");
                orderRoute.attachPatternMatched(this.onPatternMatched, this);
                // this.getOwnerComponent().getEventBus().subscribe("DetalleChannel", "ActualizarInputs", this.onPatternMatched, this);
            },
            onPatternMatched: function () {
                var _this = this;

                this._loadComboUnidadMedida();
                //Limpiamos vista
                this._limpiarVista();


                //Paginación del detalle
                var oNavModelLog = new JSONModel({
                    firstPageBtnEnable: false,
                    previousPageBtnEnable: false,
                    nextPageBtnEnable: false,
                    lastPageBtnEnable: false
                });
                _this.getView().setModel(oNavModelLog, "NavDetalleModel");

                //Paginación del LOG
                var oNavModelLog = new JSONModel({
                    firstPageBtnEnable: false,
                    previousPageBtnEnable: false,
                    nextPageBtnEnable: false,
                    lastPageBtnEnable: false
                });
                _this.getView().setModel(oNavModelLog, "NavLogModel");

                //_this.getView().byId("btnVerificaEquipo").setVisible(false);
                //_this.getView().byId("btnEEP").setVisible(false);

                nroSolicitud = this.getOwnerComponent().getModel("ModelDetalle").getProperty("/DetalleSolicitud") || 28;

                console.log("ID de la solicitud recibida: " + nroSolicitud);

                console.log("Buscando...");

                var sUrl = this.getApiVSM() + 'api/mis-solicitud/v1/find-detalle';
                var request = {
                    "solicitud_id": nroSolicitud
                }

                $.ajax({
                    url: sUrl,  // Asegúrate de que esta URL sea correcta
                    type: 'POST',
                    data: JSON.stringify(request),  // Enviar datos como JSON
                    contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    async: true,
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (data) {
                        if (data && data.SOLICITUD) {

                            var oCabecera = data.SOLICITUD;
                            _this.getView().byId("in_numero_solicitud").setValue(oCabecera.NRO_SOLICITUD);
                            _this.getView().byId("in_empresa").setValue(oCabecera.EMPRESA);
                            _this.getView().byId("in_nro_proyecto").setValue(oCabecera.NRO_PROYECTO);
                            _this.getView().byId("in_ceco_proyecto").setValue(oCabecera.CE_CO_PROYECTO);
                            _this.getView().byId("in_evaluador").setValue(oCabecera.EVALUADOR);
                            _this.getView().byId("in_referencia").setValue(oCabecera.REFERENCIA);
                            _this.getView().byId("in_fecha_solicitud").setValue(oCabecera.FECHA_SOLICITUD);
                            _this.getView().byId("in_usuario_solicitante").setValue(oCabecera.SOLICITANTE);
                            _this.getView().byId("in_nombre_proyecto").setValue(oCabecera.NOMBRE_PROYECTO);
                            _this.getView().byId("in_ceco_beneficio").setValue(oCabecera.CE_CO_BENEFICIO);
                            _this.getView().byId("in_entregar_a").setValue(oCabecera.ENTREGAR_A);
                            _this.getView().byId("in_estado").setValue(oCabecera.ESTADO);
                            _this.getView().byId("in_motivo").setValue(oCabecera.OBSERVACION);
                            //OBSERVACION



                            //Validamos estado, si es despachado = ES_SOL_DE deberá de mostrar botones de descarga
                            if (oCabecera.CODIGO_ESTADO === 'ES_SOL_DE') {
                                //_this.getView().byId("btnVerificaEquipo").setVisible(true);
                                //_this.getView().byId("btnEEP").setVisible(true);
                                //_this.getView().byId("btnGuia").setVisible(true);
                            }
                            console.log('oCabecera.CODIGO_ESTADO: ', oCabecera.CODIGO_ESTADO)
                            if (oCabecera.CODIGO_ESTADO === 'ES_SOL_RE' || oCabecera.CODIGO_ESTADO === 'ES_SOL_AN') {
                                var oLabel = _this.getView().byId("lbl_motivo");

                                if (oCabecera.CODIGO_ESTADO === 'ES_SOL_RE') {

                                    oLabel.setText("Motivo de rechazo");
                                }
                                if (oCabecera.CODIGO_ESTADO === 'ES_SOL_AN') {

                                    oLabel.setText("Motivo de anulación");
                                }
                                _this.getView().byId("bloque_rechazo").setVisible(true);
                            }
                            else {
                                _this.getView().byId("bloque_rechazo").setVisible(false);
                            }

                            if (oCabecera.CODIGO_ESTADO === 'ES_SOL_CR' || oCabecera.CODIGO_ESTADO === 'ES_SOL_RE') {
                                _this.getView().byId("btn-edit").setVisible(true);
                            }

                            if (oCabecera.CODIGO_ESTADO === 'ES_SOL_CR') {
                                _this.getView().byId("fe_estado").setVisible(false);
                            } else {
                                _this.getView().byId("fe_estado").setVisible(true);
                            }

                            let detallemodel = [];

                            data.SOLICITUD.DETALLE_SOLICITUD.forEach(function (oItem) {
                                detallemodel.push({
                                    solicitud_detalle_id: oItem.ID_SOLICITUD_DETALLE,
                                    tipo: oItem.TIPO,
                                    tipo_desc: oItem.TIPO,
                                    codigo: oItem.CODIGO,
                                    descripcion: oItem.DESCRIPCION,
                                    descripcion_adicional: oItem.DESCRIPCION_ADICIONAL,
                                    modelo: oItem.MODELO,
                                    unidad_medida_id: "",
                                    unidad_desc: oItem.UNIDAD_MEDIDA,
                                    cantidad_solicitada: oItem.CANTIDAD_SOLICITADA,
                                    cantidad_atendida: oItem.CANTIDAD_ATENDIDA,
                                    fecha_devolucion: oItem.FECHA_PROY_DEVOLUCION,
                                    observacion: oItem.OBSERVACION,
                                    herramienta_id: oItem.ID ?? "",
                                    flag_activo: true
                                });
                            });

                            console.log("detallemodel", detallemodel);

                            var oModel = new JSONModel({
                                SOLICITUD: data.SOLICITUD,
                                DETALLE_SOLICITUD: detallemodel
                                //PAGINA_ACTUAL: pPage,
                                //PAGE_SIZE: pSize,
                                //REGISTROS_TOTALES: data.REGISTROS_TOTALES,
                                //PAGINAS_TOTALES: data.PAGINAS_TOTALES
                            });
                            _this.getView().setModel(oModel, "HistoricoSolicitudDetalleModel");
                            //_this._updatePaginationButtons();
                        } else {
                            _this.openDialog("Alerta", "No se encontraron resultados para su búsqueda.", "i");
                            _this.getView().setModel(new JSONModel({ SOLICITUD: {}, DETALLE_SOLICITUD: [] }), "HistoricoSolicitudDetalleModel");
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
            _limpiarVista: function () {
                this.toggleButtonsEdit(false);
                this.getView().byId("btn-edit").setVisible(false);
                this.getView().setModel(new JSONModel({ SOLICITUD: {}, DETALLE_SOLICITUD: [] }), "HistoricoSolicitudDetalleModel");
                this.getView().byId("in_numero_solicitud").setValue("");
                this.getView().byId("in_empresa").setValue("");
                this.getView().byId("in_nro_proyecto").setValue("");
                this.getView().byId("in_ceco_proyecto").setValue("");
                this.getView().byId("in_evaluador").setValue("");
                this.getView().byId("in_referencia").setValue("");
                this.getView().byId("in_fecha_solicitud").setValue("");
                this.getView().byId("in_usuario_solicitante").setValue("");
                this.getView().byId("in_nombre_proyecto").setValue("");
                this.getView().byId("in_ceco_beneficio").setValue("");
                this.getView().byId("in_entregar_a").setValue("");
                this.getView().byId("in_estado").setValue("");
                this.getView().byId("in_motivo").setValue("");


                this.getView().setModel(new JSONModel({
                    solicitud_detalle_id: 0,
                    tipo: "",
                    tipo_desc: "",
                    codigo: "",
                    descripcion: "",
                    descripcion_adicional: "",
                    modelo: "",
                    unidad_medida_id: "",
                    unidad_desc: "",
                    cantidad_solicitada: "",
                    fecha_devolucion: "",
                    observacion: "",
                    herramienta_id: "",
                    flag_activo: true
                }), "oMotivoHerramienta");

                this.getView().setModel(new JSONModel({
                    solicitud_detalle_id: 0,
                    tipo: "",
                    tipo_desc: "",
                    codigo: "",
                    descripcion: "",
                    descripcion_adicional: "",
                    modelo: "",
                    unidad_medida_id: "",
                    unidad_desc: "",
                    cantidad_solicitada: "",
                    fecha_devolucion: "",
                    observacion: "",
                    herramienta_id: "",
                    flag_activo: true
                }), "oMotivoMaterialModel");

                this.getView().setModel(new JSONModel({ CODIGO: "", DESCRIPCION: "" }), "oFiltroHerramienta");
                this.getView().setModel(new JSONModel({ HERRAMIENTA: [] }), "BusquedaHerramienta");
                this.getView().setModel(new JSONModel({ CODIGO: "", DESCRIPCION: "" }), "oFiltroMaterialModel");
                this.getView().setModel(new JSONModel({ MATERIAL: [] }), "BusquedaMaterialModel");
            },
            _loadComboUnidadMedida: function () {
                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/combo-unidad-medida';
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
                        if (data && data.UNIDAD_MEDIDA) {
                            _this.getView().setModel(new JSONModel({ UNIDAD_MEDIDA: data.UNIDAD_MEDIDA, KEY_SELECCIONADO: '' }), "comboUnidadModel");
                        } else {
                            _this.getView().setModel(new JSONModel({ UNIDAD_MEDIDA: [], KEY_SELECCIONADO: '' }), "comboUnidadModel");
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
            onOpenDialogLog: function (oModel) {

                var _this = this;
                if (!this._oDialogLog) {
                    Fragment.load({
                        name: "missolicitudes.view.fragment.dialogLog",
                        controller: this
                    }).then(function (oDialog) {
                        this._oDialogLog = oDialog;
                        _this.getView().addDependent(_this._oDialogLog);
                        _this._loadDataLog(1);
                        this._oDialogLog.open();
                    }.bind(this));
                } else {
                    _this._loadDataLog(1);
                    this._oDialogLog.open();
                }
            },
            onCloseLog: function () {
                this._oDialogLog.close();
            },
            toggleButtonsEdit: function (bEdit) {
                var oView = this.getView();

                // Show the appropriate action buttons
                oView.byId("btn-edit").setVisible(!bEdit);
                oView.byId("btn-log").setVisible(!bEdit);

                oView.byId("btn-cancel").setVisible(bEdit);
                oView.byId("btn-save").setVisible(bEdit);
                oView.byId("btn-send").setVisible(bEdit);
                oView.byId("btn-addMaterial").setVisible(bEdit);
                oView.byId("btn-addHerramienta").setVisible(bEdit);
                oView.byId("btn-deleteDetail").setVisible(bEdit);

                this.getView().byId("idDetalleTable").setMode(bEdit ? "SingleSelectLeft" : "None");

            },
            onEdit: function () {
                this.toggleButtonsEdit(true);
            },
            onOpenDialogMaterial: function (oModel) {
                this.clearDialogMaterial();
                this._oDialogMaterial = null;

                Fragment.load({
                    name: "missolicitudes.view.fragment.dialogMaterial",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogMaterial = oDialog;
                    if (oModel) {
                        this._oDialogMaterial.setModel(new sap.ui.model.json.JSONModel(oModel), "oInfo");
                    }
                    this._oDialogMaterial.open();
                }.bind(this));
            },
            
            clearDialogMaterial: function () {
                // Obtener la instancia del diálogo
                if (this._oDialogMaterial) {
                    // Cerrar el diálogo si está abierto
                    this._oDialogMaterial.close();
                }
            
                // Obtener la tabla dentro del diálogo
                var oTable = sap.ui.getCore().byId("idMaterialTable");
            
                // Limpiar la selección de la tabla
                if (oTable) {
                    oTable.removeSelections(true); // Elimina todas las selecciones en la tabla
                }
            
                // Obtener el modelo de datos
                var oModel = this.getView().getModel("BusquedaMaterialModel");
            
                // Restablecer el modelo de datos de la tabla
                if (oModel) {
                    oModel.setProperty("/MATERIAL", []); // Vacía el array de datos de la tabla
                }
            
                // Limpiar los datos del modelo asociado al diálogo
                var oMotivoMaterialModel = this.getView().getModel("oMotivoMaterialModel");
                if (oMotivoMaterialModel) {
                    oMotivoMaterialModel.setData({}); // Limpia todos los datos en el modelo
                }
            }, 
            onCloseMaterial: function () {
                this._oDialogMaterial.close();
            },
            /*onOpenDialogMaterialAdicional: function (oModel) {

                this._oDialogMaterialAdicional = null;
                Fragment.load({
                    name: "missolicitudes.view.fragment.dialogMaterialAdicional",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogMaterialAdicional = oDialog;
                    if (oModel) {
                        this._oDialogMaterialAdicional.setModel(new sap.ui.model.json.JSONModel(oModel), "oInfo");
                    }
                    this._oDialogMaterialAdicional.open();
                }.bind(this));
            },*/
            onCloseMaterialAdicional: function () {
                this._oDialogMaterialAdicional.close();
            },
            onOpenDialogHerramienta: function (oModel) {
                console.log("aqui")

                this._oDialogHerramienta = null;

                Fragment.load({
                    name: "missolicitudes.view.fragment.dialogHerramienta",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogHerramienta = oDialog;
                    if (oModel) {
                        this._oDialogHerramienta.setModel(new sap.ui.model.json.JSONModel(oModel), "oInfo");
                    }
                    this._oDialogHerramienta.open();
                }.bind(this));
            },
            onCloseHerramienta: function () {
                this._oDialogHerramienta.close();
            },
            onOpenDialogHerramientaAdicional: function (oModel) {
                console.log("aqui")

                this._oDialogHerramientaAdicional = null;
                Fragment.load({
                    name: "missolicitudes.view.fragment.dialogHerramientaAdicional",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialogHerramientaAdicional = oDialog;
                    if (oModel) {
                        this._oDialogHerramientaAdicional.setModel(new sap.ui.model.json.JSONModel(oModel), "oInfo");
                    }
                    this._oDialogHerramientaAdicional.open();
                }.bind(this));
            },
            onCloseHerramientaAdicional: function () {
                this._oDialogHerramientaAdicional.close();
            },
            onGuardarSolicitud: function () {
                var _this = this;

                var ButtonType = mobileLibrary.ButtonType;
                var DialogType = mobileLibrary.DialogType;
                var ValueState = coreLibrary.ValueState;
                var state_ = ValueState.Information;
                this.oMessageDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Confirmación",
                    state: state_,
                    content: new Text({ text: "¿Desea guardar la solicitud?" }),
                    endButton: new Button({
                        type: ButtonType.Reject,
                        text: "Cancelar",
                        press: function () {
                            this.oMessageDialog.close();
                        }.bind(this)
                    }),
                    beginButton: new Button({
                        type: ButtonType.Accept,
                        text: "Aceptar",
                        press: function () {
                            _this._actualizarSolicitud();
                            this.oMessageDialog.close();

                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },
            _actualizarSolicitud: function () {

                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/update';
                var _this = this;

                var oDataSolicitud = this.getView().getModel("HistoricoSolicitudDetalleModel");
                var detalle = oDataSolicitud.getProperty("/DETALLE_SOLICITUD")
                var detalleActualizado = [...detalle, ...detalleEliminado];
                var params = {
                    solicitud: {
                        solicitud_id: nroSolicitud,
                        usuario: USUARIO_SISTEMA,
                        detalle: detalleActualizado
                    }
                }

                console.log("params", JSON.stringify(params));

                $.ajax({
                    url: _url,  // Asegúrate de que esta URL sea correcta
                    type: 'POST',
                    data: JSON.stringify(params),  // Enviar datos como JSON
                    contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    async: true,
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (data) {
                        if (data.SOLICITUD) {
                            const nro_solicitud = data.NRO_SOLICITUD
                            _this._finish_update(nro_solicitud);
                        } else {
                            _this.openDialog("Alerta", "Hubo un error al guardar la solicitud.", "i");
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
            onEnviarSolicitud: function () {
                var _this = this;
                var ButtonType = mobileLibrary.ButtonType;
                var DialogType = mobileLibrary.DialogType;
                var ValueState = coreLibrary.ValueState;
                var state_ = ValueState.Information;
                this.oMessageDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Confirmación",
                    state: state_,
                    content: new Text({ text: "¿Desea enviar la solicitud?" }),
                    endButton: new Button({
                        type: ButtonType.Reject,
                        text: "Cancelar",
                        press: function () {
                            this.oMessageDialog.close();
                        }.bind(this)
                    }),
                    beginButton: new Button({
                        type: ButtonType.Accept,
                        text: "Aceptar",
                        press: function () {
                            this.oMessageDialog.close();
                            _this._enviarSolicitud();
                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },
            onCancelarSolicitud: function () {
                var _this = this;

                var ButtonType = mobileLibrary.ButtonType;
                var DialogType = mobileLibrary.DialogType;
                var ValueState = coreLibrary.ValueState;
                var state_ = ValueState.Information;
                this.oMessageDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Confirmación",
                    state: state_,
                    content: new Text({ text: "¿Desea cancelar la edición de la solicitud?" }),
                    endButton: new Button({
                        type: ButtonType.Reject,
                        text: "Cancelar",
                        press: function () {
                            this.oMessageDialog.close();
                        }.bind(this)
                    }),
                    beginButton: new Button({
                        type: ButtonType.Accept,
                        text: "Aceptar",
                        press: function () {
                            this.oMessageDialog.close();
                            this.toggleButtonsEdit(false);
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(_this);
                            oRouter.navTo("RouteMain");

                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },
            _loadDataLog: function (pPage) {
                var _this = this;
                //Cargamos la data del servicio
                console.log("Buscando...");
                var sUrl = this.getApiVSM() + 'api/historico-solicitud/v1/find-log';
                var request = {
                    solicitud_id: nroSolicitud,
                    pagination: { page: pPage, page_size: gPageSize }
                }
                $.ajax({
                    url: sUrl,  // Asegúrate de que esta URL sea correcta
                    type: 'POST',
                    data: JSON.stringify(request),  // Enviar datos como JSON
                    contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    async: true,
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (data) {
                        if (data && data.SOLICITUD_LOG) {
                            var oModel = new JSONModel({
                                SOLICITUD_LOG: data.SOLICITUD_LOG,
                                PAGINA_ACTUAL: pPage,
                                REGISTROS_TOTALES: data.REGISTROS_TOTALES,
                                PAGINAS_TOTALES: data.PAGINAS_TOTALES
                            });

                            _this.getView().setModel(oModel, "SolicitudLogModel");
                            _this._updatePaginationButtonsLog();
                        } else {
                            _this.openDialog("Alerta", "No se encontraron resultados para su búsqueda.", "i");
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
            onEliminarDetalle: function () {
                var _this = this;

                var oTable = this.getView().byId("idDetalleTable");
                var oSelectedItem = oTable.getSelectedItem();

                if (!oSelectedItem) {
                    _this.openDialog("Alerta", "Debe seleccionar una herramienta.", "i");
                    return;
                }

                var oContext = oSelectedItem.getBindingContext("HistoricoSolicitudDetalleModel");
                console.log("Context: ", oContext);
                var sPath = oContext.getPath();
                console.log("Path: ", sPath);
                var oModel = this.getView().getModel("HistoricoSolicitudDetalleModel");

                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf('/') + 1), 10);
                var aDetalle = oModel.getProperty("/DETALLE_SOLICITUD");

                var tipo_desc = aDetalle[iIndex].tipo_desc;
                var descripcion = aDetalle[iIndex].descripcion;

                var dataDetalle = aDetalle[iIndex];


                console.log("dataDetalle", dataDetalle);

                var ButtonType = mobileLibrary.ButtonType;
                var DialogType = mobileLibrary.DialogType;
                var ValueState = coreLibrary.ValueState;
                var state_ = ValueState.Information;
                this.oMessageDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Confirmación",
                    state: state_,
                    content: new Text({ text: "¿Desea Eliminar " + tipo_desc + ' ' + descripcion + "? " }),
                    endButton: new Button({
                        type: ButtonType.Reject,
                        text: "Cancelar",
                        press: function () {
                            this.oMessageDialog.close();
                        }.bind(this)
                    }),
                    beginButton: new Button({
                        type: ButtonType.Accept,
                        text: "Aceptar",
                        press: function () {

                            //Validamos, actualizamos el flag y guardamos arreglo
                            if (dataDetalle.solicitud_detalle_id != 0) {
                                dataDetalle.flag_activo = false
                                detalleEliminado.push(dataDetalle);
                            }

                            aDetalle.splice(iIndex, 1);
                            oModel.setProperty("/DETALLE_SOLICITUD", aDetalle);
                            oTable.removeSelections();

                            this.oMessageDialog.close();
                            this.openDialog("Alerta", "Se ha eliminado " + tipo_desc + ' ' + descripcion + " correctamente", "i"); //i: Information, w: Warning, s: Success, e: Error
                            console.log("detalleEliminado", detalleEliminado);
                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },
            _finish: function (nro_solicitud) {
                var _this = this;

                var ButtonType = mobileLibrary.ButtonType;
                var DialogType = mobileLibrary.DialogType;
                var ValueState = coreLibrary.ValueState;
                var state_ = ValueState.Information;
                this.oMessageDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Alerta",
                    state: state_,
                    content: new Text({ text: `La solicitud Nº ${nro_solicitud} se ha enviado con éxito.` }),
                    beginButton: new Button({
                        type: ButtonType.Accept,
                        text: "Aceptar",
                        press: function () {
                            this.oMessageDialog.close();
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(_this);
                            oRouter.navTo("RouteMain");
                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },
            _finish_update: function (nro_solicitud) {
                var _this = this;
                var ButtonType = mobileLibrary.ButtonType;
                var DialogType = mobileLibrary.DialogType;
                var ValueState = coreLibrary.ValueState;
                var state_ = ValueState.Information;
                this.oMessageDialog = new Dialog({
                    type: DialogType.Message,
                    title: "Alerta",
                    state: state_,
                    content: new Text({ text: `La solicitud Nº ${nro_solicitud} se ha guardado con éxito.` }),
                    beginButton: new Button({
                        type: ButtonType.Accept,
                        text: "Aceptar",
                        press: function () {
                            this.oMessageDialog.close();

                            const dataToPass = nroSolicitud;
                            _this.getOwnerComponent().getModel("ModelDetalle").setProperty("/DetalleSolicitud", dataToPass, null, true);
                            var oModel = this.getView().getModel("HistoricoSolicitudDetalleModel");
                            // Refrescar la tabla
                            oModel.refresh(true);

                            var oRouter = sap.ui.core.UIComponent.getRouterFor(_this);
                            oRouter.navTo("RouteMain");

                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },
            _enviarSolicitud: function () {
                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/update-status';
                var _this = this;

                var oDataSolicitud = this.getView().getModel("HistoricoSolicitudDetalleModel");
                var detalle = oDataSolicitud.getProperty("/DETALLE_SOLICITUD")
                var detalleActualizado = [...detalle, ...detalleEliminado];
                var params = {
                    solicitud: {
                        solicitud_id: nroSolicitud,
                        usuario: USUARIO_SISTEMA,
                        detalle: detalleActualizado
                    }
                }

                console.log("params", JSON.stringify(params));

                $.ajax({
                    url: _url,  // Asegúrate de que esta URL sea correcta
                    type: 'POST',
                    data: JSON.stringify(params),  // Enviar datos como JSON
                    contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    async: true,
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (data) {
                        if (data.SOLICITUD) {
                            const nro_solicitud = data.NRO_SOLICITUD
                            _this._finish(nro_solicitud);
                        } else {
                            _this.openDialog("Alerta", "Hubo un error al enviar la solicitud.", "i");
                        }
                    },
                    error: function (error) {
                        sap.m.MessageToast.show("Ocurrió un error al e los datos.", {
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
            //======================================
            //Paginación Log
            //======================================
            onFirstPress: function () {
                this._setPage(1);
            },
            onPreviousPress: function () {
                let currentPage = this.getView().getModel("SolicitudLogModel").getProperty("/PAGINA_ACTUAL");
                if (currentPage > 1) {
                    this._setPage(currentPage - 1);
                }
            },
            onNextPress: function () {
                let currentPage = this.getView().getModel("SolicitudLogModel").getProperty("/PAGINA_ACTUAL");
                let totalPages = this.getView().getModel("SolicitudLogModel").getProperty("/PAGINAS_TOTALES");
                if (currentPage < totalPages) {
                    this._setPage(currentPage + 1);
                }
            },
            onLastPress: function () {
                let totalPages = this.getView().getModel("SolicitudLogModel").getProperty("/PAGINAS_TOTALES");
                this._setPage(totalPages);
            },
            _setPage: function (page) {
                this._loadDataLog(page);
            },
            _updatePaginationButtonsLog: function () {
                let currentPage = this.getView().getModel("SolicitudLogModel").getProperty("/PAGINA_ACTUAL");
                let totalPages = this.getView().getModel("SolicitudLogModel").getProperty("/PAGINAS_TOTALES");
                var oNavModel = this.getView().getModel("NavLogModel");

                oNavModel.setProperty("/firstPageBtnEnable", currentPage > 1);
                oNavModel.setProperty("/previousPageBtnEnable", currentPage > 1);
                oNavModel.setProperty("/nextPageBtnEnable", currentPage < totalPages);
                oNavModel.setProperty("/lastPageBtnEnable", currentPage < totalPages);
            },
            //======================================================
            //Herramientas
            //======================================================
            onBuscarHerramienta: function () {
                this._buscarHerramienta(1);
            },
            onOpenDialogHerramienta: function (oModel) {
                console.log("aqui")
                var _this = this;
                if (!this._oDialogHerramienta) {
                    Fragment.load({
                        name: "missolicitudes.view.fragment.dialogHerramienta",
                        controller: this
                    }).then(function (oDialog) {
                        this._oDialogHerramienta = oDialog;
                        _this.getView().addDependent(_this._oDialogHerramienta);
                        _this._buscarHerramienta(1);
                        this._oDialogHerramienta.open();
                    }.bind(this));
                } else {
                    _this._buscarHerramienta(1);
                    this._oDialogHerramienta.open();
                }
            },
            onCloseHerramienta: function () {
                var oFiltroHerramienta = this.getView().getModel("oFiltroHerramienta");
                if (oFiltroHerramienta) {
                    oFiltroHerramienta.setData({ CODIGO: "", DESCRIPCION: "" });
                }
                this._oDialogHerramienta.close();
            },
            onOpenDialogHerramientaAdicional: function (oModel) {
                console.log("aqui")

                var _this = this;
                var oTable = sap.ui.getCore().byId("idHerramientaTable");
                var aSelectedItems = oTable.getSelectedItems();

                if (aSelectedItems.length === 0 || aSelectedItems.length > 1) {
                    _this.openDialog("Alerta", "Debe seleccionar una herramienta.", "i");
                    return;
                }

                var oSelectedItem = aSelectedItems[0];
                console.log("oSelectedItem", oSelectedItem);

                var oContext = oSelectedItem.getBindingContext("BusquedaHerramienta");
                console.log("oContext", oContext);

                var iIdSolicitud = oContext.getProperty("ID_HERRAMIENTA");
                // Obtener el modelo
                var oHerramientaModel = this.getView().getModel("BusquedaHerramienta");
                // Obtener los datos del modelo
                var aHerramienta = oHerramientaModel.getProperty("/HERRAMIENTA");
                // Buscar el estado seleccionado
                var oSelectedHerramienta = aHerramienta.find(function (proyecto) {
                    return proyecto.ID_HERRAMIENTA == iIdSolicitud;
                });

                console.log("oSelectedHerramienta", oSelectedHerramienta);

                if (oSelectedHerramienta.CODIGO_ESTADO !== "ES_HERR_DP") {
                    _this.openDialog("Alerta", "La herramienta que ha seleccionado ya esta reservada.", "i");
                } else {
                    var oMotivoHerramienta = this.getView().getModel("oMotivoHerramienta");
                    if (oMotivoHerramienta) {
                        oMotivoHerramienta.setData({
                            solicitud_detalle_id: 0,
                            tipo: "H",
                            tipo_desc: "Herramienta",
                            codigo: oSelectedHerramienta.CODIGO,
                            descripcion: oSelectedHerramienta.DESCRIPCION,
                            descripcion_adicional: oSelectedHerramienta.DESCRIPCION_ADICIONAL,
                            modelo: oSelectedHerramienta.MODELO,
                            unidad_medida_id: oSelectedHerramienta.CODIGO_UNIDAD_MEDIDA,
                            unidad_desc: oSelectedHerramienta.UNIDAD_MEDIDA,
                            cantidad_solicitada: 1,
                            fecha_devolucion: "",
                            observacion: "",
                            herramienta_id: oSelectedHerramienta.ID_HERRAMIENTA,
                            flag_activo: true
                        });
                    }

                    if (!this._oDialogHerramientaAdicional) {
                        Fragment.load({
                            name: "missolicitudes.view.fragment.dialogHerramientaAdicional",
                            controller: this
                        }).then(function (oDialog) {
                            this._oDialogHerramientaAdicional = oDialog;
                            _this.getView().addDependent(_this._oDialogHerramientaAdicional);
                            this._oDialogHerramientaAdicional.open();
                        }.bind(this));
                    } else {
                        this._oDialogHerramientaAdicional.open();
                    }
                }
            },
            onAddHerramientaAdicional: function () {
                var oMotivoHerramienta = this.getView().getModel("oMotivoHerramienta");
                console.log("oMotivoHerramienta", oMotivoHerramienta.oData);


                var fecha_devolucion = oMotivoHerramienta.oData.fecha_devolucion
                console.log('fecha_devolucion: ', fecha_devolucion)
                if (!fecha_devolucion) {
                    this.openDialog("Campo Requerido", "Debe ingresar la fecha proyectada de devolución.", "e");
                    return;
                }

                // Convertir la fecha de devolución a un objeto Date para compararla
                var oFechaDevolucion = new Date(fecha_devolucion);
                var oFechaActual = new Date();

                // Comparar si la fecha de devolución es pasada a la fecha actual
                if (oFechaDevolucion < oFechaActual) {
                    this.openDialog("Fecha Inválida", "La fecha proyectada de devolución no puede ser anterior a la fecha actual.", "e");
                    return;
                }

                var oNuevaSolicitudModel = this.getView().getModel("HistoricoSolicitudDetalleModel");
                if (oNuevaSolicitudModel) {
                    var aSolicitudData = oNuevaSolicitudModel.getData();
                    aSolicitudData.DETALLE_SOLICITUD.push(oMotivoHerramienta.oData);
                    oNuevaSolicitudModel.setData(aSolicitudData);

                    // Limpiar la selección en la tabla
                    var oTable = this.getView().byId("idDetalleTable");
                    oTable.removeSelections();
                }

                this._oDialogHerramientaAdicional.close();
                this._oDialogHerramienta.close();
            },
            onCloseHerramientaAdicional: function () {
                var oMotivoHerramienta = this.getView().getModel("oMotivoHerramienta");
                if (oMotivoHerramienta) {
                    oMotivoHerramienta.setData({
                        solicitud_detalle_id: 0,
                        tipo: "",
                        tipo_desc: "",
                        codigo: "",
                        descripcion: "",
                        descripcion_adicional: "",
                        modelo: "",
                        unidad_medida_id: "",
                        unidad_desc: "",
                        cantidad_solicitada: "",
                        fecha_devolucion: "",
                        observacion: "",
                        herramienta_id: "",
                        flag_activo: true
                    });
                }
                this._oDialogHerramientaAdicional.close();
            },
            _buscarHerramienta: function (pPage) {
                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/lista-herramienta';
                var _this = this;

                var oFiltroHerramienta = this.getView().getModel("oFiltroHerramienta").getData();

                var params = {
                    CODIGO: oFiltroHerramienta.CODIGO,
                    DESCRIPCION: oFiltroHerramienta.DESCRIPCION,
                    PAGE: pPage,
                    PAGE_SIZE: gPageSize
                }

                console.log("params", params);

                $.ajax({
                    url: _url,  // Asegúrate de que esta URL sea correcta
                    type: 'POST',
                    data: JSON.stringify(params),  // Enviar datos como JSON
                    contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    async: true,
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (data) {
                        if (data && data.HERRAMIENTA) {
                            _this.getView().setModel(new JSONModel({ HERRAMIENTA: data.HERRAMIENTA }), "BusquedaHerramienta");

                        } else {
                            _this.getView().setModel(new JSONModel({ HERRAMIENTA: [] }), "BusquedaHerramienta");
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
            //======================================================
            //Materiales
            //======================================================
            onBuscarMaterial: function () {
                this._buscarMateriales(1);
            },
            onOpenDialogMaterial: function (oModel) {
                var _this = this;

                if (!this._oDialogMaterial) {

                    Fragment.load({
                        name: "missolicitudes.view.fragment.dialogMaterial",
                        controller: this
                    }).then(function (oDialog) {
                        this._oDialogMaterial = oDialog;
                        _this.getView().addDependent(_this._oDialogMaterial);
                        _this._buscarMateriales(1);
                        this._oDialogMaterial.open();
                    }.bind(this));

                } else {
                    _this._buscarMateriales(1);
                    this._oDialogMaterial.open();
                }
            },
            onCloseMaterial: function () {

                var oComboUnidadModel = this.getView().getModel("comboUnidadModel");
                if (oComboUnidadModel) {
                    var aData = oComboUnidadModel.getData();
                    aData.KEY_SELECCIONADO = '';
                    oComboUnidadModel.setData(aData);
                }

                var oFiltroMaterial = this.getView().getModel("oFiltroMaterialModel");
                if (oFiltroMaterial) {
                    oFiltroMaterial.setData({ CODIGO: "", DESCRIPCION: "" });
                }
                this._oDialogMaterial.close();
            },
            onOpenDialogMaterialAdicional: function (oModel) {

                var _this = this;
                var oTable = sap.ui.getCore().byId("idMaterialTable");
                var aSelectedItems = oTable.getSelectedItems();

                if (aSelectedItems.length === 0 || aSelectedItems.length > 1) {
                    _this.openDialog("Alerta", "Debe seleccionar un material.", "i");
                    return;
                }

                var oSelectedItem = aSelectedItems[0];
                console.log("oSelectedItem", oSelectedItem);

                var oContext = oSelectedItem.getBindingContext("BusquedaMaterialModel");
                console.log("oContext", oContext);

                var iIdSolicitud = oContext.getProperty("ID_MATERIAL");
                // Obtener el modelo
                var oHerramientaModel = this.getView().getModel("BusquedaMaterialModel");
                // Obtener los datos del modelo
                var aHerramienta = oHerramientaModel.getProperty("/MATERIAL");
                // Buscar el estado seleccionado
                var oSelectedHerramienta = aHerramienta.find(function (proyecto) {
                    return proyecto.ID_MATERIAL == iIdSolicitud;
                });

                console.log("oSelectedHerramienta", oSelectedHerramienta);

                if (oSelectedHerramienta.STOCK <= 0) {
                    _this.openDialog("Alerta", "El material seleccionado no cuenta con stock.", "i");
                } else {
                    var oMotivoMaterialModel = this.getView().getModel("oMotivoMaterialModel");
                    if (oMotivoMaterialModel) {
                        oMotivoMaterialModel.setData({
                            solicitud_detalle_id: 0,
                            tipo: "M",
                            tipo_desc: "Material",
                            codigo: oSelectedHerramienta.CODIGO_MATERIAL,
                            descripcion: oSelectedHerramienta.DESCRIPCION,
                            descripcion_adicional: oSelectedHerramienta.DESCRIPCION_ADICIONAL,
                            modelo: oSelectedHerramienta.MODELO,
                            unidad_medida_id:oSelectedHerramienta.UNIDAD_MEDIDA,// "",
                            unidad_desc: "",
                            cantidad_solicitada: 1,
                            fecha_devolucion: "-",
                            observacion: "",
                            herramienta_id: oSelectedHerramienta.ID_MATERIAL,
                            flag_activo: true
                        });
                    }

                    if (!this._oDialogMaterialAdicional) {
                        Fragment.load({
                            name: "missolicitudes.view.fragment.dialogMaterialAdicional",
                            controller: this
                        }).then(function (oDialog) {
                            this._oDialogMaterialAdicional = oDialog;
                            _this.getView().addDependent(_this._oDialogMaterialAdicional);
                            this._oDialogMaterialAdicional.open();
                        }.bind(this));
                    } else {
                        this._oDialogMaterialAdicional.open();
                    }
                }

            },
            onAddMaterialAdicional: function () {
                var _this = this;
                var oTable = sap.ui.getCore().byId("idMaterialTable");
                var aSelectedItems = oTable.getSelectedItems();

                var oSelectedItem = aSelectedItems[0];
                console.log("oSelectedItem", oSelectedItem);

                var oContext = oSelectedItem.getBindingContext("BusquedaMaterialModel");
                console.log("oContext", oContext);

                var iIdSolicitud = oContext.getProperty("ID_MATERIAL");
                // Obtener el modelo
                var oHerramientaModel = this.getView().getModel("BusquedaMaterialModel");
                // Obtener los datos del modelo
                var aHerramienta = oHerramientaModel.getProperty("/MATERIAL");
                // Buscar el estado seleccionado
                var oSelectedHerramienta = aHerramienta.find(function (proyecto) {
                    return proyecto.ID_MATERIAL == iIdSolicitud;
                });

                console.log("oSelectedMaterial", oSelectedHerramienta);
                console.log("STOCK: ", oSelectedHerramienta.STOCK);

                var oMotivoMaterialModel = this.getView().getModel("oMotivoMaterialModel");
                console.log("oMotivoMaterialModel", oMotivoMaterialModel.oData);

                var oMotivoMaterialData = oMotivoMaterialModel.getData(); // material seleccionado

                if (oSelectedHerramienta.STOCK < oMotivoMaterialData.cantidad_solicitada) {
                    _this.openDialog("Alerta", "La cantidad seleccionada del material excede al stock.", "i");
                    return;
                }

                var oComboUnidadModel = this.getView().getModel("comboUnidadModel");
                if (oComboUnidadModel) {
                    var aData = oComboUnidadModel.getData();
                    oMotivoMaterialData.unidad_medida_id = aData.KEY_SELECCIONADO;
                    /*var oSelectedUnidadMedida = aData.UNIDAD_MEDIDA.find(function (proyecto) {
                        return proyecto.CODIGO == aData.KEY_SELECCIONADO;
                    });
                    oMotivoMaterialData.unidad_desc = oSelectedUnidadMedida.VALOR;*/
                    oMotivoMaterialData.unidad_desc = oSelectedHerramienta.UNIDAD_MEDIDA;

                }

                var oNuevaSolicitudModel = this.getView().getModel("HistoricoSolicitudDetalleModel");
                if (oNuevaSolicitudModel) {
                    var aSolicitudData = oNuevaSolicitudModel.getData();
                    console.log(aSolicitudData);
                    // Verificar si el material ya ha sido añadido
                    var materialExistente = aSolicitudData.DETALLE_SOLICITUD.find(function (item) {
                        return item.codigo === oMotivoMaterialData.codigo; // Comparar por código de material o el identificador que prefieras
                    });

                    if (materialExistente) {
                        _this.openDialog("Alerta", "El material ya ha sido añadido.", "i");
                        return; // Detener si ya ha sido agregado
                    }

                    aSolicitudData.DETALLE_SOLICITUD.push(oMotivoMaterialData);
                    oNuevaSolicitudModel.setData(aSolicitudData);

                    // Limpiar la selección en la tabla
                    var oTable = this.getView().byId("idDetalleTable");
                    oTable.removeSelections();
                }

                var oFiltroMaterial = this.getView().getModel("oFiltroMaterialModel");
                //if (oFiltroMaterial) {
                    oFiltroMaterial.setData({ CODIGO: "", DESCRIPCION: "" });
                //}

                console.log(oFiltroMaterial);

                this._oDialogMaterialAdicional.close();
                //this._oDialogMaterialAdicional.destroy();

                this._oDialogMaterial.close();
                //this._oDialogMaterial.destroy();

            },
            onCloseMaterialAdicional: function () {

                var oMotivoMaterialModel = this.getView().getModel("oMotivoMaterialModel");
                if (oMotivoMaterialModel) {
                    oMotivoMaterialModel.setData({
                        solicitud_detalle_id: 0,
                        tipo: "",
                        tipo_desc: "",
                        codigo: "",
                        descripcion: "",
                        descripcion_adicional: "",
                        modelo: "",
                        unidad_medida_id: "",
                        unidad_desc: "",
                        cantidad_solicitada: "",
                        fecha_devolucion: "",
                        observacion: "",
                        herramienta_id: "",
                        flag_activo: true
                    });
                }
                this._oDialogMaterialAdicional.close();
            },
            _buscarMateriales: function (pPage) {
                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/dummy-material';
                var _this = this;

                var oFiltroMaterialModel = this.getView().getModel("oFiltroMaterialModel").getData();

                var params = {
                    CODIGO: oFiltroMaterialModel.CODIGO,
                    DESCRIPCION: oFiltroMaterialModel.DESCRIPCION,
                    PAGE: pPage,
                    PAGE_SIZE: gPageSize
                }

                console.log("params", params);
                if(params.CODIGO != '' ){
                    $.ajax({
                        url: _url,  // Asegúrate de que esta URL sea correcta
                        type: 'POST',
                        data: JSON.stringify(params),  // Enviar datos como JSON
                        contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                        async: true,
                        beforeSend: function () {
                            BusyIndicator.show(0);
                        },
                        success: function (data) {
                            if (data && data.MATERIAL) {
                                _this.getView().setModel(new JSONModel({ MATERIAL: data.MATERIAL }), "BusquedaMaterialModel");

                            } else {
                                _this.getView().setModel(new JSONModel({ MATERIAL: [] }), "BusquedaMaterialModel");
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
                }
            },

        });
    });
