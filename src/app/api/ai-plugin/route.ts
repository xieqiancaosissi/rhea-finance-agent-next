import { ACCOUNT_ID, PLUGIN_URL } from "@/app/config";
import { NextResponse } from "next/server";

export async function GET() {
  const pluginData = {
    openapi: "3.0.0",
    info: {
      title: "Rhea lending API",
      description:
        "APIs used to perform supply, borrow, withdraw, adjust, and repay operations on a lending platform.",
      version: "1.0.0",
    },
    servers: [
      {
        url: PLUGIN_URL,
      },
    ],
    "x-mb": {
      "account-id": ACCOUNT_ID,
      assistant: {
        name: "Rhea lending",
        description:
          "an assistant that helps users perform operations such as supply, borrow, repay, adjust, and withdraw on the Rhea Lending platform. By supplying assets, users can earn farm rewards offered by the platform, and through the borrow operation, users can borrow the assets they need.",
        instructions: `
                    1. API Endpoint Usage:
                      /api/tools/supply: Supply token to lending.
                      /api/tools/borrow: Borrow token from lending.
                      /api/tools/adjust: Adjust token collateral.
                      /api/tools/repay: repay token borrowed from lending.
                      /api/tools/withdraw: withdraw token from lending.
                   
                    2. Transaction generation rules:
                       The data format returned by the interface is as follows:
                       {"result":{"code":"0","data":{"amount":1,"args":{"amount":"100000","msg":"{\"Execute\": {\"actions\": [{\"Repay\": {\"max_amount\": \"100000000000000000\", \"token_id\": \"17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1\"}}]}}","receiver_id":"contract.main.burrow.near"},"contract_id":"17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1","method_name":"ft_transfer_call"},"msg":"success"}}
                       
                       When you generate a transaction, the transaction information must be obtained strictly from the information returned by the interface.
                       {
                         signerId: "Wallet User Id", // The source of information is the login wallet
                         receiverId: result.contract_id, // The source of information is the interface
                         actions: [{
                            methodName: result.method_name, // The source of information is the interface
                            args: result.data.args  // The source of information is the interface
                            gas: result.gas ? new BN(result.gas) : new BN("100000000000000");  // The source of information is the interface
                         }]
                       }
                    3.If the user supplies a token and does not specify whether collateral is required, 
                     the user is prompted to select whether collateral is required.

                    4.If the user want to repay and the user does not specify the repay type, tell the user which repay method to choose. 
                      There are two options: wallet and supplied.

                    5. If the user wants to adjust the collateral of the token and no adjustment way is specified, tell the user
                       There are two options: increase and decrease. 
                       
                    6. All tokens supported by the lending platform:
                        [
                            {
                                "symbol": "BRRR",
                                "token": "token.burrow.near",
                                "decimals": 18,
                            },
                            {
                                "symbol": "DAI",
                                "token": "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near",
                                "decimals": 18,
                            },
                            {
                                "symbol": "USDT.e",
                                "token": "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
                                "decimals": 6,
                            },
                            {
                                "symbol": "USDC.e",
                                "token": "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near",
                                "decimals": 6,
                            },
                            {
                                "symbol": "wNEAR",
                                "token": "wrap.near",
                                "decimals": 24,
                            },
                            {
                                "symbol": "STNEAR",
                                "token": "meta-pool.near",
                                "decimals": 24,
                            },
                            {
                                "symbol": "WBTC",
                                "token": "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near",
                                "decimals": 8,
                            },
                            {
                                "symbol": "AURORA",
                                "token": "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near",
                                "decimals": 18,
                            },
                            {
                                "symbol": "LINEAR",
                                "token": "linear-protocol.near",
                                "decimals": 24,
                            },
                            {
                                "symbol": "USDt",
                                "token": "usdt.tether-token.near",
                                "decimals": 6,
                            },
                            {
                                "symbol": "USDC",
                                "token": "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1",
                                "decimals": 6,
                            },
                            {
                                "symbol": "FRAX",
                                "token": "853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
                                "decimals": 18,
                            },
                            {
                                "symbol": "NBTC",
                                "token": "nbtc.bridge.near",
                                "decimals": 8,
                            },
                            {
                                "symbol": "ZEC",
                                "token": "zec.omft.near",
                                "decimals": 8,
                            },
                            {
                                "symbol": "ETH",
                                "token": "eth.bridge.near",
                                "decimals": 18,
                            }
                       ]
                       (1) This list provides the token symbol, token id, and token decimals.
                           The token_id and decimals information required by the interface can be obtained from here.
                       (2) If the token entered by the user is not supported, 
                           the user will be prompted that the token is not within the range supported by lending,
                           And show the supported tokens to the user

                    6. Please help me query the decimals of the operation token. 
                       This information does not need to be given by the user and is passed to the interface as a query parameter.  

                    7. Interface parameter prompt rules:
                       The user input information needs to be strictly checked. If the interface requires parameters, the current user does not provide,
                       that is, the parameters of required:true, the user must be prompted to provide the corresponding data, 
                       otherwise the transaction cannot be generated.    

                    8. If the user does not provide the amount of tokens to be operated, the user is prompted to provide.   

                    9. If the method to be executed for the returned transaction is storage_deposit
                       Give the user a reminder that this is your first time using lending, 
                       so you need to complete the registration before any operation
                `,
        tools: [{ type: "generate-transaction" }],
        image: "https://img.ref.finance/images/rhea_logo_svg.svg",
      },
    },
    paths: {
      "/api/tools/supply": {
        get: {
          summary: "Supply token",
          description: "Supply token to lending",
          operationId: "supply-token",
          parameters: [
            {
              name: "token_id",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The id of the supply token",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The amount of supply token",
            },
            {
              name: "is_collateral",
              in: "query",
              required: true,
              schema: {
                type: "boolean",
              },
              description:
                "Is it necessary to use the supplied token as collateral",
            },
            {
              name: "decimals",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The decimals of token",
            },
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        description: "Returned status code",
                      },
                      data: {
                        type: "object",
                        properties: {
                          amount: {
                            type: "string",
                            description: "Amount of successful supplies",
                          },
                          args: {
                            type: "object",
                            properties: {
                              amount: {
                                type: "string",
                              },
                              msg: {
                                type: "string",
                                description:
                                  "Detailed input parameters for the contract call",
                              },
                              receiver_id: {
                                type: "string",
                                description: "Borrow contract ID",
                              },
                            },
                          },
                          contract_id: {
                            type: "string",
                            description: "Token ID of the supplied token",
                          },
                          method_name: {
                            type: "string",
                          },
                        },
                      },
                      msg: {
                        type: "string",
                        description: "result message",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Error response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/borrow": {
        get: {
          summary: "Borrow token",
          description: "Borrow token from lending",
          operationId: "borrow-token",
          parameters: [
            {
              name: "token_id",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The id of the borrow token",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The amount of borrow token",
            },
            {
              name: "decimals",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The decimals of token",
            },
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        description: "Returned status code",
                      },
                      data: {
                        type: "object",
                        properties: {
                          amount: {
                            type: "number",
                            description: "The amount of token lent.",
                          },
                          args: {
                            type: "object",
                            properties: {
                              msg: {
                                type: "string",
                                description:
                                  "Detailed input parameters for the contract call",
                              },
                              receiver_id: {
                                type: "string",
                                description: "Borrow contract ID",
                              },
                            },
                          },
                          contract_id: {
                            type: "string",
                            description: "The Id of the calling contract",
                          },
                          method_name: {
                            type: "string",
                            description: "Token method of Calling the contract",
                          },
                        },
                      },
                      msg: {
                        type: "string",
                        description: "result message",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Error response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/withdraw": {
        get: {
          summary: "Withdraw token",
          description: "Withdraw token from lending",
          operationId: "withdraw-token",
          parameters: [
            {
              name: "token_id",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The id of the withdraw token",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The amount of withdraw token",
            },
            {
              name: "decimals",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The decimals of token",
            },
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        description: "Returned status code",
                      },
                      data: {
                        type: "object",
                        properties: {
                          amount: {
                            type: "number",
                            description: "The amount of token to be withdrawn.",
                          },
                          args: {
                            type: "object",
                            properties: {
                              actions: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    Withdraw: {
                                      type: "object",
                                      properties: {
                                        max_amount: {
                                          type: "string",
                                          description: "Withdraw token amount",
                                        },
                                        token_id: {
                                          type: "string",
                                          description: "Withdraw token id",
                                        },
                                      },
                                    },
                                    DecreaseCollateral: {
                                      type: "object",
                                      properties: {
                                        token_id: {
                                          type: "string",
                                          description:
                                            "Decrease the token id of collateral",
                                        },
                                        amount: {
                                          type: "string",
                                          description:
                                            "Decrease the amount of collateral",
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          contract_id: {
                            type: "string",
                            description: "The Id of the calling contract",
                          },
                          method_name: {
                            type: "string",
                            description: "Token method of Calling the contract",
                          },
                        },
                      },
                      msg: {
                        type: "string",
                        description: "result message",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Error response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/repay": {
        get: {
          summary: "Repay token",
          description: "Repay token from lending",
          operationId: "repay-token",
          parameters: [
            {
              name: "token_id",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The id of the repay token",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The amount of repay token",
            },
            {
              name: "decimals",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The decimals of token",
            },
            {
              name: "from",
              in: "query",
              required: true,
              schema: {
                type: "string",
                enum: ["wallet", "supplied"],
              },
              description: "Where to repay token",
            },
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        description: "Returned status code",
                      },
                      data: {
                        type: "object",
                        properties: {
                          amount: {
                            type: "number",
                            description: "The amount of token to repay.",
                          },
                          args: {
                            type: "object",
                            description:
                              "Details of the parameters required for the transaction",
                            properties: {
                              amount: {
                                type: "number",
                                description: "The amount of token to repay.",
                              },
                              msg: {
                                type: "string",
                                description:
                                  "Detailed input parameters for the contract call",
                              },
                              receiver_id: {
                                type: "string",
                                description:
                                  "Borrow contract ID, Just parameters",
                              },
                            },
                          },
                          contract_id: {
                            type: "string",
                            description: "contract ID",
                          },
                          method_name: {
                            type: "string",
                            description: "Token method of Calling the contract",
                          },
                        },
                      },
                      msg: {
                        type: "string",
                        description: "result message",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Error response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tools/adjust": {
        get: {
          summary: "adjust collateral for token",
          description:
            "Adjust the amount of collateral, Users can increase or decrease the amount of collateral",
          operationId: "adjust-collateral-token",
          parameters: [
            {
              name: "token_id",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The id of the repay token",
            },
            {
              name: "amount",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The amount of repay token",
            },
            {
              name: "decimals",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
              description: "The decimals of token",
            },
            {
              name: "type",
              in: "query",
              required: true,
              schema: {
                type: "string",
                enum: ["increase", "decrease"],
              },
              description: "Select the adjustment way",
            },
          ],
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        description: "Returned status code",
                      },
                      data: {
                        type: "object",
                        properties: {
                          amount: {
                            type: "number",
                            description: "The amount of token to adjust.",
                          },
                          args: {
                            type: "object",
                            description:
                              "Details of the parameters required for the transaction",
                          },
                          contract_id: {
                            type: "string",
                            description: "contract ID",
                          },
                          method_name: {
                            type: "string",
                            description: "Token method of Calling the contract",
                          },
                        },
                      },
                      msg: {
                        type: "string",
                        description: "result message",
                      },
                    },
                  },
                },
              },
            },
            "500": {
              description: "Error response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        description: "Error message",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(pluginData);
}
