namespace riskmanagement;
using{
    managed,
    cuid,
    User,
    sap.common.CodeList
}from '@sap/cds/common';
using { API_BUSINESS_PARTNER as external} from '../srv/external/API_BUSINESS_PARTNER.csn';
entity Risks : cuid, managed {
    key ID                  : String;
    title                   : String(100);
    owner                   : String;
    prio                    : Association to Priority;
    descr                   : String;
    miti                    : Association to Mitigations;
    impact                  : Integer;
    bp                      : Association to BusinessPartners;
    virtual criticality     : Integer;
    virtual PrioCriticality : Integer;
}
entity Mitigations : cuid, managed{
    key ID      : String;
    descr       : String;
    owner       : String;
    timeline    : String;
    risks       : Association to many Risks on risks.miti = $self;
}
entity Priority : CodeList {
    key code : String enum {
            high = 'H';
            medium = 'M';
            low = 'L';
        };
}
entity BusinessPartners as projection on external.A_BusinessPartner {
    key BusinessPartner,
    BusinessPartnerFullName as FullName,
}
