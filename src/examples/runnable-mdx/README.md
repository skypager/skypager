# Runnable MDX Example

The [SITE-TEMPLATE.md](SITE-TEMPLATE.md) example file produces the following AST

```json

 {
  "type": "root",
  "children": [
    {
      "type": "heading",
      "depth": 1,
      "children": [
        {
          "type": "link",
          "title": null,
          "url": "https://soederpop.com",
          "children": [
            {
              "type": "text",
              "value": "My Website",
              "position": {
                "start": {
                  "line": 2,
                  "column": 4,
                  "offset": 4
                },
                "end": {
                  "line": 2,
                  "column": 14,
                  "offset": 14
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 2,
              "column": 3,
              "offset": 3
            },
            "end": {
              "line": 2,
              "column": 38,
              "offset": 38
            },
            "indent": []
          }
        }
      ],
      "position": {
        "start": {
          "line": 2,
          "column": 1,
          "offset": 1
        },
        "end": {
          "line": 2,
          "column": 38,
          "offset": 38
        },
        "indent": []
      }
    },
    {
      "type": "paragraph",
      "children": [
        {
          "type": "link",
          "title": null,
          "url": "https://link.to/designer/",
          "children": [
            {
              "type": "text",
              "value": "Sketchfile Link",
              "position": {
                "start": {
                  "line": 4,
                  "column": 2,
                  "offset": 41
                },
                "end": {
                  "line": 4,
                  "column": 17,
                  "offset": 56
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 4,
              "column": 1,
              "offset": 40
            },
            "end": {
              "line": 4,
              "column": 45,
              "offset": 84
            },
            "indent": []
          }
        },
        {
          "type": "text",
          "value": "\n",
          "position": {
            "start": {
              "line": 4,
              "column": 45,
              "offset": 84
            },
            "end": {
              "line": 5,
              "column": 1,
              "offset": 85
            },
            "indent": [
              1
            ]
          }
        },
        {
          "type": "link",
          "title": null,
          "url": "https://google-sheets.com/my/spreadsheets/my-website/mock-data",
          "children": [
            {
              "type": "text",
              "value": "Mock Data",
              "position": {
                "start": {
                  "line": 5,
                  "column": 2,
                  "offset": 86
                },
                "end": {
                  "line": 5,
                  "column": 11,
                  "offset": 95
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 5,
              "column": 1,
              "offset": 85
            },
            "end": {
              "line": 5,
              "column": 76,
              "offset": 160
            },
            "indent": []
          }
        },
        {
          "type": "text",
          "value": "\n",
          "position": {
            "start": {
              "line": 5,
              "column": 76,
              "offset": 160
            },
            "end": {
              "line": 6,
              "column": 1,
              "offset": 161
            },
            "indent": [
              1
            ]
          }
        },
        {
          "type": "link",
          "title": null,
          "url": "https://google-docs/my/documents/my-website/content",
          "children": [
            {
              "type": "text",
              "value": "Page Copy",
              "position": {
                "start": {
                  "line": 6,
                  "column": 2,
                  "offset": 162
                },
                "end": {
                  "line": 6,
                  "column": 11,
                  "offset": 171
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 6,
              "column": 1,
              "offset": 161
            },
            "end": {
              "line": 6,
              "column": 65,
              "offset": 225
            },
            "indent": []
          }
        }
      ],
      "position": {
        "start": {
          "line": 4,
          "column": 1,
          "offset": 40
        },
        "end": {
          "line": 6,
          "column": 65,
          "offset": 225
        },
        "indent": [
          1,
          1
        ]
      }
    },
    {
      "type": "heading",
      "depth": 2,
      "children": [
        {
          "type": "text",
          "value": "Sitemap",
          "position": {
            "start": {
              "line": 8,
              "column": 4,
              "offset": 230
            },
            "end": {
              "line": 8,
              "column": 11,
              "offset": 237
            },
            "indent": []
          }
        }
      ],
      "position": {
        "start": {
          "line": 8,
          "column": 1,
          "offset": 227
        },
        "end": {
          "line": 8,
          "column": 12,
          "offset": 238
        },
        "indent": []
      }
    },
    {
      "type": "list",
      "ordered": false,
      "start": null,
      "loose": false,
      "children": [
        {
          "type": "listItem",
          "loose": false,
          "checked": null,
          "children": [
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "link",
                  "title": null,
                  "url": "/",
                  "children": [
                    {
                      "type": "text",
                      "value": "Home",
                      "position": {
                        "start": {
                          "line": 10,
                          "column": 4,
                          "offset": 243
                        },
                        "end": {
                          "line": 10,
                          "column": 8,
                          "offset": 247
                        },
                        "indent": []
                      }
                    }
                  ],
                  "position": {
                    "start": {
                      "line": 10,
                      "column": 3,
                      "offset": 242
                    },
                    "end": {
                      "line": 10,
                      "column": 12,
                      "offset": 251
                    },
                    "indent": []
                  }
                }
              ],
              "position": {
                "start": {
                  "line": 10,
                  "column": 3,
                  "offset": 242
                },
                "end": {
                  "line": 10,
                  "column": 12,
                  "offset": 251
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 10,
              "column": 1,
              "offset": 240
            },
            "end": {
              "line": 10,
              "column": 12,
              "offset": 251
            },
            "indent": []
          }
        },
        {
          "type": "listItem",
          "loose": false,
          "checked": null,
          "children": [
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "link",
                  "title": null,
                  "url": "/about",
                  "children": [
                    {
                      "type": "text",
                      "value": "About",
                      "position": {
                        "start": {
                          "line": 11,
                          "column": 4,
                          "offset": 255
                        },
                        "end": {
                          "line": 11,
                          "column": 9,
                          "offset": 260
                        },
                        "indent": []
                      }
                    }
                  ],
                  "position": {
                    "start": {
                      "line": 11,
                      "column": 3,
                      "offset": 254
                    },
                    "end": {
                      "line": 11,
                      "column": 18,
                      "offset": 269
                    },
                    "indent": []
                  }
                },
                {
                  "type": "text",
                  "value": " ",
                  "position": {
                    "start": {
                      "line": 11,
                      "column": 18,
                      "offset": 269
                    },
                    "end": {
                      "line": 11,
                      "column": 19,
                      "offset": 270
                    },
                    "indent": []
                  }
                }
              ],
              "position": {
                "start": {
                  "line": 11,
                  "column": 3,
                  "offset": 254
                },
                "end": {
                  "line": 11,
                  "column": 19,
                  "offset": 270
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 11,
              "column": 1,
              "offset": 252
            },
            "end": {
              "line": 11,
              "column": 19,
              "offset": 270
            },
            "indent": []
          }
        },
        {
          "type": "listItem",
          "loose": false,
          "checked": null,
          "children": [
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "link",
                  "title": null,
                  "url": "/contact-us",
                  "children": [
                    {
                      "type": "text",
                      "value": "Contact US",
                      "position": {
                        "start": {
                          "line": 12,
                          "column": 4,
                          "offset": 274
                        },
                        "end": {
                          "line": 12,
                          "column": 14,
                          "offset": 284
                        },
                        "indent": []
                      }
                    }
                  ],
                  "position": {
                    "start": {
                      "line": 12,
                      "column": 3,
                      "offset": 273
                    },
                    "end": {
                      "line": 12,
                      "column": 28,
                      "offset": 298
                    },
                    "indent": []
                  }
                },
                {
                  "type": "text",
                  "value": " ",
                  "position": {
                    "start": {
                      "line": 12,
                      "column": 28,
                      "offset": 298
                    },
                    "end": {
                      "line": 12,
                      "column": 29,
                      "offset": 299
                    },
                    "indent": []
                  }
                }
              ],
              "position": {
                "start": {
                  "line": 12,
                  "column": 3,
                  "offset": 273
                },
                "end": {
                  "line": 12,
                  "column": 29,
                  "offset": 299
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 12,
              "column": 1,
              "offset": 271
            },
            "end": {
              "line": 12,
              "column": 29,
              "offset": 299
            },
            "indent": []
          }
        },
        {
          "type": "listItem",
          "loose": false,
          "checked": null,
          "children": [
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "link",
                  "title": null,
                  "url": "/products",
                  "children": [
                    {
                      "type": "text",
                      "value": "Products",
                      "position": {
                        "start": {
                          "line": 13,
                          "column": 4,
                          "offset": 303
                        },
                        "end": {
                          "line": 13,
                          "column": 12,
                          "offset": 311
                        },
                        "indent": []
                      }
                    }
                  ],
                  "position": {
                    "start": {
                      "line": 13,
                      "column": 3,
                      "offset": 302
                    },
                    "end": {
                      "line": 13,
                      "column": 24,
                      "offset": 323
                    },
                    "indent": []
                  }
                }
              ],
              "position": {
                "start": {
                  "line": 13,
                  "column": 3,
                  "offset": 302
                },
                "end": {
                  "line": 13,
                  "column": 24,
                  "offset": 323
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 13,
              "column": 1,
              "offset": 300
            },
            "end": {
              "line": 13,
              "column": 24,
              "offset": 323
            },
            "indent": []
          }
        },
        {
          "type": "listItem",
          "loose": false,
          "checked": null,
          "children": [
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "link",
                  "title": null,
                  "url": "/products/:id",
                  "children": [
                    {
                      "type": "text",
                      "value": "Product Details",
                      "position": {
                        "start": {
                          "line": 14,
                          "column": 4,
                          "offset": 327
                        },
                        "end": {
                          "line": 14,
                          "column": 19,
                          "offset": 342
                        },
                        "indent": []
                      }
                    }
                  ],
                  "position": {
                    "start": {
                      "line": 14,
                      "column": 3,
                      "offset": 326
                    },
                    "end": {
                      "line": 14,
                      "column": 35,
                      "offset": 358
                    },
                    "indent": []
                  }
                }
              ],
              "position": {
                "start": {
                  "line": 14,
                  "column": 3,
                  "offset": 326
                },
                "end": {
                  "line": 14,
                  "column": 35,
                  "offset": 358
                },
                "indent": []
              }
            }
          ],
          "position": {
            "start": {
              "line": 14,
              "column": 1,
              "offset": 324
            },
            "end": {
              "line": 14,
              "column": 35,
              "offset": 358
            },
            "indent": []
          }
        }
      ],
      "position": {
        "start": {
          "line": 10,
          "column": 1,
          "offset": 240
        },
        "end": {
          "line": 14,
          "column": 35,
          "offset": 358
        },
        "indent": [
          1,
          1,
          1,
          1
        ]
      }
    }
  ],
  "position": {
    "start": {
      "line": 1,
      "column": 1,
      "offset": 0
    },
    "end": {
      "line": 14,
      "column": 35,
      "offset": 358
    }
  }
}
```

We can use this AST to extract the language nouns and attributes that it references.

We assume things about each noun based on the heading it belongs to.

We assume links to certain types of files can be parsed and followed as well through some AST format.

We use these assumptions to build a script which will turn any other SITE-TEMPLATE.md file into a full blown react website and deploy it. 