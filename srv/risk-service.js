// import the cds facade object (https://cap.cloud.sap/docs/node.js/cds-facade)
const cds = require('@sap/cds')

// the service implementation with all service handlers
module.exports = cds.service.impl(async function() {

    // define constants for the Risk and BusinessPartner entities from the risk-service.js file
    const {Risks, BusinessPartners} = this.entities;

    // this handler will be executed directly after a read operation on Risks
    // with this we can loop through the received dataset and manipulate the single Risk entries
    this.after("READ", Risks, (data) => {
        // converto to array , if it's only a single risk, so that the code don't break here
        const risks = Array.isArray(data) ? data : [data];

        // looping the array of Risks to set the virtual field 'criticality', defined in the schema
        risks.forEach((risk) => {
            if (risk.impact >= 100000) {
                risk.criticality = 1;
            }else {
                risk.criticality = 2;
            }

            // set criticality for priority
            switch(risk.prio_code){
                case 'H':
                    risk.PrioCriticality  = 1;
                    break;
                case 'M':
                    risk.PrioCriticality  = 2;
                    break;
                case 'L':
                    risk.PrioCriticality  = 3;
                    break;
                default:
                    break;
            }
        })
    });

    // connect to remote service
    const BPsrv = await cds.connect.to("API_BUSINESS_PARTNER");

    /**
     *  Event-Handler for read events on the BusinessPartners entity.
     *  Each request to the API Business Hub requires the API Key in the header 
     */
    this.on("READ", BusinessPartners, async (req) => {

        // the API Sandbox returns a lot of business partners with empty names
        // we remove them
        req.query.where(" LastName <> '' and FirstName <> '' ");

        return await BPsrv.transaction(req).send({
            query: req.query,
            headers: {
                apikey: process.env.apikey
            }
        })

    });

// Risks?$expand=bp (Expand on BusinessPartner)
this.on("READ", Risks, async (req, next) => {
	/*
	 Check whether the request wants an "expand" of the business partner
	 As this is not possible, the risk entity and the business partner entity are in different systems (SAP BTP and S/4 HANA Cloud), 
	 if there is such an expand, remove it
   */
	if (!req.query.SELECT.columns) return next();

   const expandIndex = req.query.SELECT.columns.findIndex(
	   ({ expand, ref }) => expand && ref[0] === "bp"
   );

   if (expandIndex < 0) return next();

   // Remove expand from query
   req.query.SELECT.columns.splice(expandIndex, 1);

   // Make sure bp_BusinessPartner (ID) will be returned
   if (!req.query.SELECT.columns.find((column) =>
	   column.ref.find((ref) => ref == "bp_BusinessPartner")
   )
   ) {
	   req.query.SELECT.columns.push({ ref: ["bp_BusinessPartner"] });
   }

   const risks = await next();

   const asArray = x => Array.isArray(x) ? x : [x];

   // Request all associated BusinessPartners
   const bpIDs = asArray(risks).map(risk => risk.bp_BusinessPartner);
   const busienssPartners = await BPsrv.transaction(req).send({
	   query: SELECT.from(this.entities.BusinessPartners).where({ BusinessPartner: bpIDs }),
	   headers: {
		   apikey: process.env.apikey,
	   }
   });

   // Convert in a map for easier lookup
   const bpMap = {};
   for (const businessPartner of busienssPartners)
	   bpMap[businessPartner.BusinessPartner] = businessPartner;

   // Add BusinessPartners to result
   for (const note of asArray(risks)) {
	   note.bp = bpMap[note.bp_BusinessPartner];
   }

   return risks;
});

});