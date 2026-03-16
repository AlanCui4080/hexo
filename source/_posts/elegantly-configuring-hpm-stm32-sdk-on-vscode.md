---
title: Elegantly Configuring HPM/STM32 Development Environment on VSCode
tags: []
categories:
  - CS Embedded
date: 2025-05-14 16:40:48
---

## HPM

First, create an environment variable HPM_SDK_BASE pointing to the hpm_sdk within sdk_env. In the future, if the SDK is upgraded, you only need to change this variable to perform a one-click migration. Then, install the C/C++ Extensions Pack in VSCode and write the following configuration file into ``.vscode/settings.json``. This will not only allow the CMake extension to automatically detect the toolchain included in the HPM_SDK, but also configure the C/C++ extension to activate the language server.

```json
{
    "cmake.cmakePath": "${env:HPM_SDK_BASE}/../tools/cmake/bin/cmake.exe",
    "cmake.additionalCompilerSearchDirs": [
        "${env:HPM_SDK_BASE}/../toolchains/rv32imac_zicsr_zifencei_multilib_b_ext-win/bin",
    ],
    "cmake.generator": "Ninja",
    "cmake.configureArgs": [
        "-DCMAKE_MAKE_PROGRAM=${env:HPM_SDK_BASE}/../tools/ninja/ninja.exe",
    ],
    "cmake.configureEnvironment": {
        "GNURISCV_TOOLCHAIN_PATH": "${env:HPM_SDK_BASE}/../toolchains/rv32imac_zicsr_zifencei_multilib_b_ext-win/",
    },
    "C_Cpp.default.configurationProvider": "ms-vscode.cmake-tools",
}
```

After completing the VSCode configuration, use the following ``CMakeLists.txt`` to set up your project. It includes reserved settings for the SDK and components, and you can change ``USB_DEVICE`` and ``HPM5300EVK`` to the options you need. This will automatically detect .c and .cpp files under /src and add them to the build target, while also adding /include as a header directory.

```cmake
cmake_minimum_required(VERSION 3.13)

# setup sdk 
set(BOARD hpm5300evk)
set(HPM_BUILD_TYPE flash_xip)

# setup compoenents
set(CONFIG_USB_DEVICE TRUE)

message(STATUS "HPM SDK Base: $ENV{HPM_SDK_BASE}")
message(STATUS "HPM SDK Toolchain: ${GNURISCV_TOOLCHAIN_PATH}")

find_package(hpm-sdk REQUIRED HINTS $ENV{HPM_SDK_BASE})

project(hello_world)

file(GLOB_RECURSE SOURCES src/*.c src/*.cpp)

sdk_inc(${CMAKE_CURRENT_SOURCE_DIR}/include)
sdk_app_src(${SOURCES})
```

At this point, you can already build and highlight HPM firmware code using VSCode. Next, configure the .vscode/tasks.json file to write the algorithm for downloading and waiting for debug: 

Note: there is an extra set of curly braces around the parameters passed to OpenOCD, because TCL interprets backslashes as escape characters by default. For Windows paths, [OpenOCD recommends using curly braces to avoid escaping](https://openocd.org/doc/html/FAQ.html).

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "download_and_attach",
            "type": "shell",
            "dependsOn": "CMake: build",
            "command": "${env:HPM_SDK_BASE}/../tools/openocd/openocd.exe",
            "args": [
                "-c",
                "set HPM_SDK_BASE {${env:HPM_SDK_BASE}}; set BOARD hpm5300evk; set PROBE ft2232;",
                "-f",
                "${env:HPM_SDK_BASE}/boards/openocd/hpm5300_all_in_one.cfg",
                "-c",
                "program {${workspaceFolder}/build/output/demo.elf} verify; reset_soc"
            ],
            "isBackground": true,
            "problemMatcher": [
                {
                "pattern": [
                    {
                    "regexp": ".",
                    "file": 1,
                    "location": 2,
                    "message": 3
                    }
                ],
                "background": {
                    "activeOnStart": true,
                    "beginsPattern": ".",
                    "endsPattern": ".",
                }
                }
            ],
        },
        {
            "label": "kill_openocd",
            "command": "echo ${input:terminate}",
            "type": "shell",
            "problemMatcher": []
        }
    ],
    "inputs": [
        {
            "id": "terminate",
            "type": "command",
            "command": "workbench.action.tasks.terminate",
            "args": "terminateAll"
        }
    ]
}
```

Add ``.vscode/launch.json`` to start the GDB server and attach to OpenOCD:
```json
{
    "configurations": [
    {
        "name": "(hpm_sdk) Flash&Debug",
        "type": "cppdbg",
        "request": "launch",
        "program": "${workspaceFolder}/build/output/demo.elf",
        "cwd": "${workspaceFolder}",
        "preLaunchTask":"download_and_attach",
        "postDebugTask": "kill_openocd",
        "miDebuggerPath": "${env:HPM_SDK_BASE}/../toolchains/rv32imac_zicsr_zifencei_multilib_b_ext-win/bin/riscv32-unknown-elf-gdb.exe",
        "setupCommands": [
            {
                "text": "target remote localhost:3333",
                "description": "Connect to the target",
                "ignoreFailures": false
            },
        ],
    }
    ]
}
```

It's all done to debug the program:
![](https://alancui.cc/wp-content/uploads/2025/05/QQ20250514-172832.png)

## STM32
- Intsall [https://marketplace.visualstudio.com/items?itemName=stmicroelectronics.stm32-vscode-extension](https://marketplace.visualstudio.com/items?itemName=stmicroelectronics.stm32-vscode-extension)。
- Switch to Pre-Release
- Done!

You can choose
- Generate project by the extension without any extra configuration;
- Generate project by STM32CubeMX, select CMake as build system while generating, then open the folder in VSCode. The extension will automaticly identify the project now.

Add ``.vscode/launch.json`` to start the GDB server and attach to STlink:
```json
{
    "version": "0.2.0",
    "configurations": [
        
        {
            "type": "stlinkgdbtarget",
            "request": "launch",
            "name": "STM32Cube: STM32 Launch ST-Link GDB Server",
            "origin": "snippet",
            "cwd": "${workspaceFolder}",
            "runEntry": "main",
            "imagesAndSymbols": [
                {
                    "imageFileName": "${command:st-stm32-ide-debug-launch.get-projects-binary-from-context1}"
                }
            ],
            "preBuild": "${command:st-stm32-ide-debug-launch.build}"
        }
    ]
}
```
