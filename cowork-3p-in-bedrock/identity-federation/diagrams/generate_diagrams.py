#!/usr/bin/env python3
"""Generate 3 architecture diagrams for the Cowork 3P federation guide."""
import os
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.ml import Bedrock
from diagrams.aws.security import (
    Cognito, IAMRole, IAMAWSSts,
    IdentityAndAccessManagementIam,
    IdentityAndAccessManagementIamLongTermSecurityCredential,
    SingleSignOn,
)
from diagrams.aws.general import Client, GenericSDK, User, GenericOfficeBuilding, Disk

outdir = "launches/features/cowork/external"
os.chdir(os.path.abspath("."))

common_attrs = {"fontsize": "13", "pad": "0.4", "bgcolor": "white"}
zone_device = {"bgcolor": "#E8F4F8", "style": "filled,rounded"}
zone_corp = {"bgcolor": "#FFF4E0", "style": "filled,rounded"}
zone_aws = {"bgcolor": "#FFEED8", "style": "filled,rounded"}

# ============================================================================
# PATH 1 — Direct IdP Federation (Cognito / Entra / Okta via credential_process)
# ============================================================================
with Diagram(
    "Path 1 - Direct IdP Federation (Recommended for Production)",
    show=False, direction="LR",
    filename=os.path.join(outdir, "cowork-path1-direct-idp"),
    graph_attr=common_attrs,
):
    with Cluster("User's Local Device", graph_attr=zone_device):
        user1 = User("User")
        cowork1 = Client("Claude Cowork\nDesktop")
        aws_profile1 = GenericSDK("AWS profile\n(credential_process)")
        helper1 = GenericSDK("OIDC Helper\nScript")

    with Cluster("Corporate IdP\n(Cognito / Entra / Okta / Auth0)", graph_attr=zone_corp):
        idp1 = Cognito("OIDC Provider")

    with Cluster("Your AWS Account", graph_attr=zone_aws):
        oidc_p1 = IdentityAndAccessManagementIam("IAM OIDC\nProvider")
        sts1 = IAMAWSSts("STS\nAssumeRoleWith\nWebIdentity")
        role1 = IAMRole("Bedrock Role")
        bedrock1 = Bedrock("Amazon Bedrock\n(Claude Models)")

    user1 >> Edge(label="1. Open") >> cowork1
    cowork1 >> Edge(label="2. Get creds\n(via profile)") >> aws_profile1
    aws_profile1 >> Edge(label="3. Run helper") >> helper1
    helper1 >> Edge(label="4. OIDC PKCE\n(browser)", color="blue", style="dashed") >> idp1
    idp1 >> Edge(label="5. ID Token (JWT)", color="blue") >> helper1
    helper1 >> Edge(label="6. Exchange JWT") >> sts1
    sts1 >> Edge(label="trust", style="dotted") >> oidc_p1
    sts1 >> Edge(label="trust", style="dotted") >> role1
    sts1 >> Edge(label="7. Temp AWS creds") >> aws_profile1
    cowork1 >> Edge(label="8. InvokeModel", color="darkgreen", style="bold") >> bedrock1

# ============================================================================
# PATH 2 — IAM Identity Center (SSO)
# ============================================================================
with Diagram(
    "Path 2 - IAM Identity Center (SSO)",
    show=False, direction="LR",
    filename=os.path.join(outdir, "cowork-path2-identity-center"),
    graph_attr=common_attrs,
):
    with Cluster("User's Local Device", graph_attr=zone_device):
        user2 = User("User")
        cowork2 = Client("Claude Cowork\nDesktop")
        aws_cli2 = GenericSDK("AWS CLI v2\n(sso_session profile)")
        sso_cache2 = Disk("~/.aws/sso/cache")

    with Cluster("Corporate IdP (Optional, via SAML/SCIM)", graph_attr=zone_corp):
        external_idp2 = GenericOfficeBuilding("External IdP\n(Entra / Okta /\nGoogle Workspace)")

    with Cluster("Your AWS Account", graph_attr=zone_aws):
        idc2 = SingleSignOn("IAM Identity\nCenter")
        perm_set2 = IAMRole("Permission Set\n(Bedrock Access)")
        bedrock2 = Bedrock("Amazon Bedrock\n(Claude Models)")

    user2 >> Edge(label="1. Open") >> cowork2
    cowork2 >> Edge(label="2. Read profile") >> aws_cli2
    aws_cli2 >> Edge(label="3. aws sso login\n(first time or expiry)", style="dashed") >> idc2
    idc2 >> Edge(label="federation\n(optional)", style="dotted", color="gray") >> external_idp2
    idc2 >> Edge(label="4. Access token") >> sso_cache2
    sso_cache2 >> Edge(label="5. GetRoleCredentials") >> idc2
    idc2 >> Edge(label="6. Assume") >> perm_set2
    perm_set2 >> Edge(label="7. Temp creds") >> aws_cli2
    cowork2 >> Edge(label="8. InvokeModel", color="darkgreen", style="bold") >> bedrock2

# ============================================================================
# PATH 3 — Bedrock API Key (Bearer Token)
# ============================================================================
with Diagram(
    "Path 3 - Bedrock API Key (Bearer Token)",
    show=False, direction="LR",
    filename=os.path.join(outdir, "cowork-path3-api-key"),
    graph_attr=common_attrs,
):
    with Cluster("User's Local Device", graph_attr=zone_device):
        user3 = User("User")
        cowork3 = Client("Claude Cowork\nDesktop")
        config3 = Disk("Managed Config\ninferenceBedrock\nBearerToken")

    with Cluster("Your AWS Account", graph_attr=zone_aws):
        iam_user3 = IAMRole("IAM User\n(Bedrock service\nprincipal)")
        api_key3 = IdentityAndAccessManagementIamLongTermSecurityCredential("Bedrock API Key\n(short or long-term)")
        bedrock3 = Bedrock("Amazon Bedrock\n(Claude Models)")

    user3 >> Edge(label="1. Open") >> cowork3
    cowork3 >> Edge(label="2. Read token") >> config3
    iam_user3 - Edge(label="associated with", style="dotted") - api_key3
    config3 - Edge(label="stores", style="dotted") - api_key3
    cowork3 >> Edge(label="3. InvokeModel\nAuthorization: Bearer", color="darkgreen", style="bold") >> bedrock3

print("✅ All 3 diagrams generated")
