sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'riskmanagement/riskmanagement/test/integration/FirstJourney',
		'riskmanagement/riskmanagement/test/integration/pages/RisksList',
		'riskmanagement/riskmanagement/test/integration/pages/RisksObjectPage'
    ],
    function(JourneyRunner, opaJourney, RisksList, RisksObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('riskmanagement/riskmanagement') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheRisksList: RisksList,
					onTheRisksObjectPage: RisksObjectPage
                }
            },
            opaJourney.run
        );
    }
);