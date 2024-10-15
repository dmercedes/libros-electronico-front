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
        const NOMBRE_EMPRESA = "ANDDES ASOCIADOS S.A.C.";
        const USUARIO_SOLICITANTE = "Javier Rivas";
        const USUARIO_EMAIL = "jrivas@pruebas.com"
        const USUARIO_SISTEMA = "JRIVAS";
        const gPageSize = 100;

        return BaseController.extend("missolicitudes.controller.NuevaSolicitud", {
            onInit: function () {
                this._loadFiltro();
                this._loadComboUnidadMedida();
                this.getView().byId("in_empresa").setValue(NOMBRE_EMPRESA);
                this.getView().byId("in_usuario_solicitante").setValue(USUARIO_SOLICITANTE);

                this.getView().setModel(new JSONModel({ CODIGO: "", DESCRIPCION: "" }), "oFiltroHerramienta");
                this.getView().setModel(new JSONModel({ HERRAMIENTA: [] }), "BusquedaHerramienta");
                this.getView().setModel(new JSONModel({
                    solicitud_detalle_id: 0,
                    tipo: "",
                    tipo_desc: "",
                    codigo: "",
                    descripcion: "",
                    unidad_medida_id: "",
                    unidad_desc: "",
                    cantidad_solicitada: "",
                    fecha_devolucion: "",
                    observacion: "",
                    herramienta_id: "",
                    flag_activo: true
                }), "oMotivoHerramienta");

                this.getView().setModel(new JSONModel({
                    solicitud: {
                        nro_solicitud: 0,
                        empresa: NOMBRE_EMPRESA,
                        id_proyecto: 0,
                        solicitante: USUARIO_SOLICITANTE,
                        entrega_a: "",
                        referencia: "",
                        evaluador: "",
                        usuario: USUARIO_SISTEMA,
                        detalle: []
                    }
                }), "oNuevaSolicitud");

                this.getView().setModel(new JSONModel({ CODIGO: "", DESCRIPCION: "" }), "oFiltroMaterialModel");
                this.getView().setModel(new JSONModel({ MATERIAL: [] }), "BusquedaMaterialModel");
                this.getView().setModel(new JSONModel({
                    solicitud_detalle_id: 0,
                    tipo: "",
                    tipo_desc: "",
                    codigo: "",
                    descripcion: "",
                    unidad_medida_id: "",
                    unidad_desc: "",
                    cantidad_solicitada: "",
                    fecha_devolucion: "",
                    observacion: "",
                    herramienta_id: "",
                    flag_activo: true
                }), "oMotivoMaterialModel");

                this.getOwnerComponent().getEventBus().subscribe("SolicitudChannel", "ActualizarNumeroSolicitud", this._loadFiltro, this);
            },
            onEliminarDetalle: function () {
                var _this = this;

                var oTable = this.getView().byId("idNuevaHerramientaTable");
                var oSelectedItem = oTable.getSelectedItem();

                if (!oSelectedItem) {
                    _this.openDialog("Alerta", "Debe seleccionar un registro.", "i");
                    return;
                }

                var oContext = oSelectedItem.getBindingContext("oNuevaSolicitud");
                console.log("Context: ", oContext);
                var sPath = oContext.getPath();
                console.log("Path: ", sPath);
                var oModel = this.getView().getModel("oNuevaSolicitud");

                var iIndex = parseInt(sPath.substring(sPath.lastIndexOf('/') + 1), 10);
                var aDetalle = oModel.getProperty("/solicitud/detalle");

                var tipo_desc = aDetalle[iIndex].tipo_desc;
                var descripcion = aDetalle[iIndex].descripcion;

                console.log("aDetalle", aDetalle[iIndex]);

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

                            aDetalle.splice(iIndex, 1);
                            oModel.setProperty("/solicitud/detalle", aDetalle);
                            oTable.removeSelections();

                            this.oMessageDialog.close();
                            this.openDialog("Alerta", "Se ha eliminado " + tipo_desc + ' ' + descripcion + " correctamente", "i"); //i: Information, w: Warning, s: Success, e: Error
                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },

            _loadFiltro: function () {
                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/combo-nuevo';
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
                        if (data && data.PROYECTO && data.ENTREGA_A) {

                            _this.getView().setModel(new JSONModel({
                                ENTREGA_A: data.ENTREGA_A,
                                EMAIL_PERSONA: USUARIO_EMAIL
                            }), "listaEntregarA");

                            _this.getView().setModel(new JSONModel({ PROYECTO: data.PROYECTO }), "listaNroProyecto");


                            var oNuevaSolicitudModel = _this.getView().getModel("oNuevaSolicitud");
                            if (oNuevaSolicitudModel) {
                                var aSolicitudData = oNuevaSolicitudModel.getData();
                                _this.getView().byId("in_numero_solicitud").setValue(data.NRO_SOLICITUD);
                                aSolicitudData.solicitud.nro_solicitud = data.NRO_SOLICITUD;

                                oNuevaSolicitudModel.setData(aSolicitudData);
                            }



                        } else {
                            _this.getView().setModel(new JSONModel({ ENTREGA_A: [] }), "listaEntregarA");
                            _this.getView().setModel(new JSONModel({ PROYECTO: [] }), "listaNroProyecto");
                            _this.getView().byId("in_numero_solicitud").setValue("");

                            var oNuevaSolicitudModel = _this.getView().getModel("oNuevaSolicitud");
                            if (oNuevaSolicitudModel) {
                                var aSolicitudData = oNuevaSolicitudModel.getData();
                                aSolicitudData.solicitud.nro_solicitud = 0;
                                oNuevaSolicitudModel.setData(aSolicitudData);
                            }
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
            onNroProyectoChange: function (oEvent) {

                var oNuevaSolicitudModel = this.getView().getModel("oNuevaSolicitud");
                if (oNuevaSolicitudModel) {
                    var aSolicitudData = oNuevaSolicitudModel.getData();

                    if (oEvent.getParameter("selectedItem")) {
                        var sSelectedKey = oEvent.getParameter("selectedItem").getKey();
                        console.log('sSelectedKey: ', sSelectedKey);

                        // Obtener el modelo estadoModel
                        var oProyectoModel = this.getView().getModel("listaNroProyecto");

                        // Obtener los datos del modelo
                        var aProyecto = oProyectoModel.getProperty("/PROYECTO");

                        // Buscar el estado seleccionado
                        var oSelectedEstado = aProyecto.find(function (proyecto) {
                            return proyecto.ID_PROYECTO == sSelectedKey;
                        });

                        if (oSelectedEstado) {
                            this.getView().byId("in_nombre_proyecto").setValue(oSelectedEstado.NOMBRE_PROYECTO);
                            this.getView().byId("in_ceco_beneficio").setValue(oSelectedEstado.CE_CO_BENEFICIO);
                            this.getView().byId("in_ceco_proyecto").setValue(oSelectedEstado.CE_CO_PROYECTO);
                            this.getView().byId("in_evaluador").setValue(oSelectedEstado.EVALUADOR);

                            aSolicitudData.solicitud.id_proyecto = oSelectedEstado.ID_PROYECTO;
                            aSolicitudData.solicitud.evaluador = oSelectedEstado.EVALUADOR;
                        }

                    } else {
                        console.log('sSelectedKey: null');
                        this.getView().byId("in_nombre_proyecto").setValue("");
                        this.getView().byId("in_ceco_beneficio").setValue("");
                        this.getView().byId("in_ceco_proyecto").setValue("");
                        this.getView().byId("in_evaluador").setValue("");
                        aSolicitudData.solicitud.id_proyecto = 0;
                        aSolicitudData.solicitud.evaluador = "";
                    }


                    oNuevaSolicitudModel.setData(aSolicitudData);
                }


            },
            onEntregaAChange: function (oEvent) {

                var oNuevaSolicitudModel = this.getView().getModel("oNuevaSolicitud");
                if (oNuevaSolicitudModel) {
                    var aSolicitudData = oNuevaSolicitudModel.getData();

                    var oComboBox = oEvent.getSource();
                    var oSelectedItem = oComboBox.getSelectedItem();

                    if (oSelectedItem) {
                        var sSelectedKey = oComboBox.getSelectedKey(); // Esto obtiene el valor del key seleccionado (el email en tu caso)
                        var sNombrePersona = oSelectedItem.getText(); // Esto obtiene el texto asociado al item seleccionado (el nombre de la persona)

                        console.log("Email seleccionado:", sSelectedKey);
                        console.log("SelectedKey:", sNombrePersona);
                        aSolicitudData.solicitud.entrega_a = sNombrePersona

                    }

                    oNuevaSolicitudModel.setData(aSolicitudData);
                }



            },
            onGuardarSolicitud: function () {

                var _this = this;

                //Iniciar validación
                var requiredFields = [
                    "cbo-nro-proyecto", "cbo-entregar-a"];

                var isValid = true;

                requiredFields.forEach(function (fieldId) {
                    var oField = _this.getView().byId(fieldId);
                    var value = oField.getValue ? oField.getValue() : oField.getSelectedKey();
                    if (!value) {
                        oField.setValueState(sap.ui.core.ValueState.Error);
                        oField.setValueStateText("Este campo es requerido.");
                        isValid = false;
                    } else {
                        oField.setValueState(sap.ui.core.ValueState.None);
                    }
                });

                if (isValid) {
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
                                this.oMessageDialog.close();
                                _this._onGuardarSolicitud();

                            }.bind(this)
                        })
                    });

                    this.oMessageDialog.open();
                }

            },
            _onGuardarSolicitud: function () {

                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/insert';
                var _this = this;

                // Obtener el ComboBox por su ID
                var oComboBoxEntregarA = this.getView().byId("cbo-entregar-a");
                var oSelectedItem = oComboBoxEntregarA.getSelectedItem(); // Obtener el item seleccionado

                // Verifica que haya un item seleccionado
                var sNombrePersona = oSelectedItem ? oSelectedItem.getText() : ""; // Obtener el nombre de la persona
                var sEmailPersona = oComboBoxEntregarA.getSelectedKey(); // Obtener el email seleccionado (el key del ComboBox)

                var oNuevaSolicitudModel = this.getView().getModel("oNuevaSolicitud");
                var data = oNuevaSolicitudModel.getData()

                data.solicitud.entrega_a = sNombrePersona

                console.log("oNuevaSolicitud_model", JSON.stringify(data));
                //return;
                $.ajax({
                    url: _url,  // Asegúrate de que esta URL sea correcta
                    type: 'POST',
                    data: JSON.stringify(data),  // Enviar datos como JSON
                    contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    async: true,
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (data) {
                        console.log('data: ', data)


                        if (data.STATUS) {
                            const nro_solicitud = data.SOLICITUD.NRO_SOLICITUD
                            //console.log('nro_solicitud: ',nro_solicitud)
                            _this.onFinish(nro_solicitud);
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
            onFinish: function (nro_solicitud) {
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
                            //this.getView().byId("in_numero_solicitud").setValue('');
                            this.getView().byId("in_ceco_beneficio").setValue('');
                            this.getView().byId("in_ceco_proyecto").setValue('');
                            this.getView().byId("in_nombre_proyecto").setValue('');
                            this.getView().byId("in_evaluador").setValue('');
                            this.getView().byId("in_referencia").setValue('');
                            this.getView().byId("cbo-nro-proyecto").setValue("");
                            var oModel = this.getView().getModel("oNuevaSolicitud");

                            // Vaciar el array vinculado a la propiedad 'detalle' dentro de 'solicitud'
                            oModel.setProperty("/solicitud/detalle", []);

                            // Refrescar la tabla
                            oModel.refresh(true);
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(_this);
                            oRouter.navTo("RouteMain");
                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },
            onEnviarSolicitud: function () {

                var _this = this;

                //Iniciar validación
                var requiredFields = [
                    "cbo-nro-proyecto", "cbo-entregar-a"];

                var isValid = true;

                requiredFields.forEach(function (fieldId) {
                    var oField = _this.getView().byId(fieldId);
                    var value = oField.getValue ? oField.getValue() : oField.getSelectedKey();
                    if (!value) {
                        oField.setValueState(sap.ui.core.ValueState.Error);
                        oField.setValueStateText("Este campo es requerido.");
                        isValid = false;
                    } else {
                        oField.setValueState(sap.ui.core.ValueState.None);
                    }
                });

                if (isValid) {
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
                                _this._onEnviarSolicitud();

                            }.bind(this)
                        })
                    });

                    this.oMessageDialog.open();
                }
            },
            _onEnviarSolicitud: function () {

                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/send-nueva-solicitud';
                var _this = this;

                // Obtener el ComboBox por su ID
                var oComboBoxEntregarA = this.getView().byId("cbo-entregar-a");
                var oSelectedItem = oComboBoxEntregarA.getSelectedItem(); // Obtener el item seleccionado

                // Verifica que haya un item seleccionado
                var sNombrePersona = oSelectedItem ? oSelectedItem.getText() : ""; // Obtener el nombre de la persona
                var sEmailPersona = oComboBoxEntregarA.getSelectedKey(); // Obtener el email seleccionado (el key del ComboBox)

                var oNuevaSolicitudModel = this.getView().getModel("oNuevaSolicitud");
                var data = oNuevaSolicitudModel.getData()

                data.solicitud.entrega_a = sNombrePersona

                console.log("oNuevaSolicitud_model", JSON.stringify(data));

                //return;

                $.ajax({
                    url: _url,  // Asegúrate de que esta URL sea correcta
                    type: 'POST',
                    data: JSON.stringify(data),  // Enviar datos como JSON
                    contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    async: true,
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (data) {
                        console.log('data: ', data)


                        if (data.STATUS) {
                            const nro_solicitud = data.SOLICITUD.NRO_SOLICITUD
                            //console.log('nro_solicitud: ',nro_solicitud)
                            _this.onFinishEnviar(nro_solicitud);
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
            onFinishEnviar: function (nro_solicitud) {
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
                            //this.getView().byId("in_numero_solicitud").setValue('');
                            this.getView().byId("in_ceco_beneficio").setValue('');
                            this.getView().byId("in_ceco_proyecto").setValue('');
                            this.getView().byId("in_nombre_proyecto").setValue('');
                            this.getView().byId("in_evaluador").setValue('');
                            this.getView().byId("in_referencia").setValue('');
                            this.getView().byId("cbo-nro-proyecto").setValue("");
                            var oModel = this.getView().getModel("oNuevaSolicitud");

                            // Vaciar el array vinculado a la propiedad 'detalle' dentro de 'solicitud'
                            oModel.setProperty("/solicitud/detalle", []);

                            // Refrescar la tabla
                            oModel.refresh(true);
                            var oRouter = sap.ui.core.UIComponent.getRouterFor(_this);
                            oRouter.navTo("RouteMain");
                        }.bind(this)
                    })
                });

                this.oMessageDialog.open();
            },

            //======================================================
            //Herramientas
            //======================================================
            onBuscarHerramienta: function () {
                this._buscarHerramienta(1);
            },
            onOpenDialogHerramienta: function (oModel) {
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

                var oNuevaSolicitudModel = this.getView().getModel("oNuevaSolicitud");
                var aSolicitudData = oNuevaSolicitudModel.getData();
                console.log('aSolicitudData: ', aSolicitudData)
                console.log('aSolicitudData.solicitud.detalle: ', aSolicitudData.solicitud.detalle)

                const coincide = aSolicitudData.solicitud.detalle.some(item => item.codigo === oSelectedHerramienta.CODIGO)

                if (coincide) {
                    _this.openDialog("Alerta", "La herramienta seleccionada ya ha sido agregada.", "i");
                    return;
                }

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

                var oNuevaSolicitudModel = this.getView().getModel("oNuevaSolicitud");
                if (oNuevaSolicitudModel) {
                    var aSolicitudData = oNuevaSolicitudModel.getData();
                    console.log('aSolicitudData: ', aSolicitudData)
                    aSolicitudData.solicitud.detalle.push(oMotivoHerramienta.oData);
                    oNuevaSolicitudModel.setData(aSolicitudData);

                    // Limpiar la selección en la tabla
                    var oTable = this.getView().byId("idNuevaHerramientaTable");
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
                this.clearDialogMaterial();
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

                console.log("oSelectedMaterial", oSelectedHerramienta);
                console.log("STOCK: ", oSelectedHerramienta.STOCK);

                if (oSelectedHerramienta.STOCK <= 0) {
                    _this.openDialog("Alerta", "El material seleccionado no cuenta con stock.", "i");
                } else {
                    var oMotivoMaterialModel = this.getView().getModel("oMotivoMaterialModel");
                    if (oMotivoMaterialModel) {
                        oMotivoMaterialModel.setData({
                            solicitud_detalle_id: 0,
                            tipo: "M",
                            tipo_desc: "Material",
                            //codigo: oSelectedHerramienta.CODIGO_MATERIAL,
                            //descripcion: oSelectedHerramienta.DESCRIPCION,
                            //unidad_medida_id: oSelectedHerramienta.UNIDAD_MEDIDA,
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

                console.log(oMotivoMaterialData);
                console.log(oSelectedHerramienta.STOCK);
                console.log(oMotivoMaterialData.cantidad_solicitada);

                if (parseInt(oSelectedHerramienta.STOCK) < parseInt(oMotivoMaterialData.cantidad_solicitada)) {
                    _this.openDialog("Alerta", "La cantidad seleccionada del material excede al stock.", "i");
                    return;
                }
                // Obtener la descripción ingresada en la caja de texto
                var sUnidadDesc = oMotivoMaterialData.unidad_medida_id; // Texto ingresado en el campo de texto

                // Verificar si la descripción corresponde a algún ID
                var oComboUnidadModel = this.getView().getModel("comboUnidadModel");
                if (oComboUnidadModel) {
                    var aData = oComboUnidadModel.getData().UNIDAD_MEDIDA;
                    console.log(aData);
                    // Buscar la unidad de medida que corresponde a la descripción ingresada
                    var oSelectedUnidadMedida = aData.find(function (unidad) {
                        return unidad.CODIGO === sUnidadDesc; // Comparar descripción con el valor ingresado
                    });
                    oMotivoMaterialData.unidad_desc = oSelectedHerramienta.UNIDAD_MEDIDA;

                    /*if (oSelectedUnidadMedida) {
                        // Si encuentra la unidad de medida, asigna el ID correspondiente
                        oMotivoMaterialData.unidad_medida_id = oSelectedUnidadMedida.CODIGO;
                        oMotivoMaterialData.unidad_desc = oSelectedUnidadMedida.VALOR;
                    } else {
                        // Manejar el caso cuando no encuentra coincidencia
                        _this.openDialog("Alerta", "La descripción de la unidad de medida no corresponde a ningún ID.", "i");
                        return;
                    }*/
                }

                var oNuevaSolicitudModel = this.getView().getModel("oNuevaSolicitud");
                if (oNuevaSolicitudModel) {

                    var aSolicitudData = oNuevaSolicitudModel.getData();   

                    // Verificar si el material ya ha sido añadido
                    var materialExistente = aSolicitudData.solicitud.detalle.find(function (item) {
                        return item.codigo === oMotivoMaterialData.codigo; // Comparar por código de material o el identificador que prefieras
                    });

                    if (materialExistente) {
                        _this.openDialog("Alerta", "El material ya ha sido añadido.", "i");
                        return; // Detener si ya ha sido agregado
                    }

                    aSolicitudData.solicitud.detalle.push(oMotivoMaterialData);
                    oNuevaSolicitudModel.setData(aSolicitudData);

                    // Limpiar la selección en la tabla
                    var oTable = this.getView().byId("idNuevaHerramientaTable");
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

                //this._oDialogMaterialAdicional.close();
                //this._oDialogMaterialAdicional.destroy();


                //this._oDialogMaterial.close();
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
            _buscarMateriales: async function (pPage) {
                var _url = this.getApiVSM() + 'api/mis-solicitud/v1/dummy-material';
                var _this = this;

                var oFiltroMaterialModel = this.getView().getModel("oFiltroMaterialModel").getData();

                var params = {
                    CODIGO: oFiltroMaterialModel.CODIGO,
                    DESCRIPCION: oFiltroMaterialModel.DESCRIPCION,
                    PAGE: pPage,
                    PAGE_SIZE: 100//gPageSize
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
                

                /*try {
                    // Definir los parámetros para el nuevo servicio OData
                    var filtroProducto = 'TG11';  // Estos valores deberían ser dinámicos según tus necesidades
                    var filtroDescripcion = 'wire';

                    // Construir la URL del servicio OData
                    var _urlOData = "https://my411404-api.s4hana.cloud.sap/sap/opu/odata/sap/API_PRODUCT_SRV/A_ProductDescription?$filter=substringof('" + encodeURIComponent(filtroProducto) + "', Product) and substringof('" + encodeURIComponent(filtroDescripcion) + "', ProductDescription)";

                    var usuario = 'COM_0164';
                    var contrasena = 'xZxQKfh]as9WzUteMbMlWMALcVTfsGVCVnKgNgcW';
                    var credenciales = btoa(usuario + ':' + contrasena);  // Codificación Base64
                
                        // Mostrar el indicador de carga al inicio de la función
                    BusyIndicator.show(0);
            
                    // Realizar la llamada al nuevo servicio OData
                    const odataResponse = await $.ajax({
                        url: _urlOData,
                        type: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic ' + credenciales,  // Encabezado de autenticación básica
                            'Accept': 'application/json'
                        }
                    });
            
                    console.log("Datos del nuevo servicio OData", odataResponse);
            
                    // Extraer todos los valores de 'Product'
                    const products = odataResponse.d.results.map(result => result.Product);
                    console.log("Productos obtenidos:", products);
            
                    // Realizar la llamada original después de la exitosa llamada al servicio OData
                    const data = await $.ajax({
                        url: _url,  // Asegúrate de que esta URL sea correcta
                        type: 'POST',
                        data: JSON.stringify(params),  // Enviar datos como JSON
                        contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                    });
            
                    if (data && data.MATERIAL) {
                        _this.getView().setModel(new JSONModel({ MATERIAL: data.MATERIAL }), "BusquedaMaterialModel");
                    } else {
                        _this.getView().setModel(new JSONModel({ MATERIAL: [] }), "BusquedaMaterialModel");
                    }
            
                } catch (error) {
                    console.error('Error durante las llamadas AJAX:', error);
                    sap.m.MessageToast.show("Ocurrió un error al cargar los datos.", {
                        duration: 3000,
                        width: "20em",
                        my: "center center",
                        at: "center center"
                    });
                } finally {
                    // Ocultar el indicador de carga una vez finalizadas todas las llamadas
                    BusyIndicator.hide();
                }*/


                /*
                // Realizar la llamada al nuevo servicio OData
                $.ajax({
                    url: _urlOData,
                    type: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + credenciales,  // Encabezado de autenticación básica
                        'Accept': 'application/json'
                    },
                    beforeSend: function () {
                        BusyIndicator.show(0);
                    },
                    success: function (odataResponse) {
                        console.log("Datos del nuevo servicio OData", odataResponse);

                        // Si la llamada OData es exitosa, proceder con la llamada original
                        $.ajax({
                            url: _url,  // Asegúrate de que esta URL sea correcta
                            type: 'GET',
                            data: JSON.stringify(params),  // Enviar datos como JSON
                            contentType: 'application/json',  // Establecer el tipo de contenido a JSON
                            async: true,
                            beforeSend: function () {
                                BusyIndicator.show(0);
                            },
                            success: function (data) {
                                if (data && data.MATERIAL) {
                                    _this.getView().setModel(new JSONModel({ MATERIAL: data.MATERIAL }), "BusquedaMaterialModel");

                                    // Extraer todos los valores de 'Product'
                                    const products = odataResponse.d.results.map(result => result.Product);

                                    // Mostrar los valores de 'Product' en la consola
                                    console.log("Productos obtenidos:", products);

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

                    },
                    error: function (error) {
                        console.error('Error al llamar al servicio OData:', error);
                        sap.m.MessageToast.show("Ocurrió un error al obtener los datos del producto.", {
                            duration: 3000,
                            width: "20em",
                            my: "center center",
                            at: "center center"
                        });
                    },
                    complete: function () {
                        BusyIndicator.hide();
                    }
                });*/
            },
        });
    });