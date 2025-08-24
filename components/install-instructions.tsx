/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Share } from "lucide-react"

export function InstallInstructions() {
  return (
    <section id="install-instructions" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Install Calari on Your Device
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get the full app experience by installing Calari directly to your home screen.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <Tabs defaultValue="ios" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="ios" className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                iOS (iPhone/iPad)
              </TabsTrigger>
              <TabsTrigger value="android" className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1518-.5972.416.416 0 00-.5972.1518l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1333 1.0989L4.8442 5.4467a.4161.4161 0 00-.5972-.1518.416.416 0 00-.1518.5972L6.0927 9.321C3.4180 10.7725 1.6667 13.2869 1.6667 16.1667 1.6667 16.1667 22.3333 16.1667 22.3333 16.1667 22.3333 13.2869 20.5820 10.7725 17.9073 9.321" />
                </svg>
                Android
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Install on iOS</h3>
                      <p className="text-sm text-muted-foreground">Using Safari Browser</p>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Step 1 - Open Safari */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 relative overflow-hidden">
                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-0.5 bg-gray-400 rounded-full"></div>
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-gray-400 rounded-full"></div>
                            <div className="mt-3 mx-1 h-12 bg-blue-500 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Open in Safari</p>
                            <p className="text-xs text-muted-foreground">Use Safari browser</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 - Share Button */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 relative overflow-hidden">
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                              <Share className="w-3 h-3 text-white" />

                            </div>
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Tap Share Button</p>
                            <p className="text-xs text-muted-foreground">Bottom center of Safari</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 - Add to Home Screen */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 relative overflow-hidden">
                            <div className="mt-2 mx-1 space-y-1">
                              <div className="h-1.5 bg-gray-400 rounded w-8"></div>
                              <div className="h-1.5 bg-gray-400 rounded w-6"></div>
                              <div className="flex items-center gap-1 mt-2 p-1 bg-green-100 rounded">
                                <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                </svg>
                                <div className="h-1 bg-green-600 rounded w-4"></div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Add to Home Screen</p>
                            <p className="text-xs text-muted-foreground">Scroll down to find option</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 - Confirm */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-4 bg-blue-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">Add</span>
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Tap "Add"</p>
                            <p className="text-xs text-muted-foreground">Confirm installation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="android">
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1518-.5972.416.416 0 00-.5972.1518l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1333 1.0989L4.8442 5.4467a.4161.4161 0 00-.5972-.1518.416.416 0 00-.1518.5972L6.0927 9.321C3.4180 10.7725 1.6667 13.2869 1.6667 16.1667 1.6667 16.1667 22.3333 16.1667 22.3333 16.1667 22.3333 13.2869 20.5820 10.7725 17.9073 9.321" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">Install on Android</h3>
                      <p className="text-sm text-muted-foreground">Using Chrome Browser</p>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Step 1 - Open Chrome */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 relative overflow-hidden">
                            <div className="mt-3 mx-1 h-12 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 rounded flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Open in Chrome</p>
                            <p className="text-xs text-muted-foreground">Use Chrome browser</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 - Menu Button */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 relative overflow-hidden">
                            <div className="absolute top-2 right-2 w-4 h-4 bg-gray-600 rounded flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                              </svg>
                            </div>
                            <div className="absolute top-1 right-1 w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Tap Menu (⋮)</p>
                            <p className="text-xs text-muted-foreground">Top right corner</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 - Add to Home Screen */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 relative overflow-hidden">
                            <div className="mt-2 mx-1 space-y-1">
                              <div className="h-1.5 bg-gray-400 rounded w-8"></div>
                              <div className="h-1.5 bg-gray-400 rounded w-6"></div>
                              <div className="flex items-center gap-1 mt-2 p-1 bg-green-100 rounded">
                                <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                </svg>
                                <div className="h-1 bg-green-600 rounded w-4"></div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Add to Home screen</p>
                            <p className="text-xs text-muted-foreground">Find in menu options</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 - Confirm */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-20 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-gray-600 relative overflow-hidden">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-4 bg-green-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">Add</span>
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">Tap "Add"</p>
                            <p className="text-xs text-muted-foreground">Confirm installation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  )
}
