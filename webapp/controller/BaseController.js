sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox",
    "sap/m/Dialog",
	"sap/m/Button",
	"sap/m/library",
	"sap/m/Text",
    "sap/ui/core/library",
], function(Controller, History, UIComponent,MessageBox, Dialog, Button, mobileLibrary, Text, coreLibrary) {
	"use strict";
	return Controller.extend("missolicitudes.controller.BaseController", {
		getApiVSM: function(){
			//return "https://and_herr_node-restless-otter-zi.cfapps.us10-001.hana.ondemand.com/";
			return "http://localhost:8089/";
			//return "./backend/";
		},
        openDialog: function(title, text, state){
            
            var ButtonType = mobileLibrary.ButtonType;
            var DialogType = mobileLibrary.DialogType;
            var ValueState = coreLibrary.ValueState;
            var state_ = ValueState.Information;

            if(state == "s"){
                state_ = ValueState.Success;
            }

            if(state == "e"){
                state_ = ValueState.Error;
            }

            if(state == "w"){
                state_ = ValueState.Warning;
            }

            if(state == "i"){
                state_ = ValueState.Information;
            }

            
            this.oMessageDialog = new Dialog({
                type: DialogType.Message,
                title: title,
                state: state_,
                content: new Text({ text: text }),
                beginButton: new Button({
                    type: ButtonType.Emphasized,
                    text: "OK",
                    press: function () {
                        this.oMessageDialog.close();
                    }.bind(this)
                })
            });

            this.oMessageDialog.open();
        },
		
		onGetModel: function(){
			var oData = sap.ui.getCore().getModel("modelGeneral").getData();
			this.getView().setModel(new sap.ui.model.json.JSONModel(oData),"modelGeneral")
		},
		onSetModel: function(){
			var oData = this.getView().getModel("modelGeneral").getData();
			sap.ui.getCore().setModel(new sap.ui.model.json.JSONModel(oData),"modelGeneral")
		},
		formatFecha: function(createdDate){
			if(createdDate === null){
				return createdDate;
			}
			
			var partes = createdDate.split(/[\s/:\-]/);
			var fecha = new Date(partes[2], partes[1] - 1, partes[0], partes[3], partes[4], partes[5]);
			if (isNaN(fecha.getTime())) {
				return createdDate;
			}
			fecha.setHours(fecha.getHours() - 5);
			return fecha.toLocaleString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

		},
		getRouter : function () {
			return UIComponent.getRouterFor(this);
		},

	});

});