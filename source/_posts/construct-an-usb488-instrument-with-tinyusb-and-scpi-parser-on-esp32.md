---
title: Construct an USB488 instrument with TinyUSB and scpi-parser on ESP32
tags: []
categories:
  - Embedded
  - Test&Measure
date: 2025-09-22 15:48:45
---

IEEE 488, as well GP-IB, is an actual standard of communication and controling in electrical test and measuring devices, USB TMC USB488 device class implements multiple characters which IEEE 488 have. We are going to support following capabilities on ESP32:

*   All MANDATORY SCPI
*   SR1 - Support for SRQ
*   DT1 - Support for device trigger
*   RL0 - Not support for Local/Remote operations, this device designed to accept commands from an queue, there is no need for switching between two modes. Also, TinyUSB not supports that.

<!-- more -->

### Preparation

```c
#ifndef CFG_TUSB_OS
#define CFG_TUSB_OS OPT_OS_FREERTOS
#endif

#ifndef ESP_PLATFORM
#define ESP_PLATFORM 1
#endif

#ifndef CFG_TUSB_DEBUG
#define CFG_TUSB_DEBUG 0
#endif

#define CFG_TUSB_OS_INC_PATH freertos/

#define CFG_TUSB_DEBUG_PRINTF esp_rom_printf

// Enable Device stack
#define CFG_TUD_ENABLED       1

#define CFG_TUD_USBTMC                1
#define CFG_TUD_USBTMC_ENABLE_INT_EP  1
#define CFG_TUD_USBTMC_ENABLE_488     1

```c
static usbtmc_response_capabilities_488_t const
    tud_usbtmc_app_capabilities = { .USBTMC_status          = USBTMC_STATUS_SUCCESS,
                                    .bcdUSBTMC              = USBTMC_VERSION,
                                    .bmIntfcCapabilities    = { .listenOnly             = 0,
                                                                .talkOnly               = 0,
                                                                .supportsIndicatorPulse = 1 },
                                    .bmDevCapabilities      = { .canEndBulkInOnTermChar = 1 },
                                    .bcdUSB488              = USBTMC_488_VERSION,
                                    .bmIntfcCapabilities488 = { .supportsTrigger     = 1,
                                                                .supportsREN_GTL_LLO = 1,
                                                                .is488_2             = 1 },
                                    .bmDevCapabilities488   = {
                                          .SCPI = 1, // SCPI Supported
                                          .SR1  = 1, // SRQ Supported
                                          .RL1  = 0, // Local/Remote switch Not supported
                                          .DT1  = 1, // Device trigger Supported
                                    } };
```

The scpi parser and state management uses the scpi-parser library (https://github.com/j123b567/scpi-parser). Since the library's build system uses Makefiles, a custom CMakeLists.txt is used to make it recognizable by the CMake build system and registered as a component by idf. The contents are as follows:


```cmake
cmake_minimum_required(VERSION 3.5)

file(GLOB LIBSCPI_SOURCES
    "${CMAKE_CURRENT_SOURCE_DIR}/src/*.c"
    "${CMAKE_CURRENT_SOURCE_DIR}/src/*.cpp"
)


idf_component_register(SRCS "${LIBSCPI_SOURCES}"
    INCLUDE_DIRS ${CMAKE_CURRENT_SOURCE_DIR}/inc
)
```

Then, register it as a dependency：

libscpi: path: ../thirdparty/scpi-parser/libscpi

```
libscpi:
    path: ../thirdparty/scpi-parser/libscpi
```

### Application

```c
//
// Implements four USB status functions. If programming for portable
// instruments, consider using this function to save energy.
//

void tud_mount_cb(void)
{
    ESP_LOGI(TAG, "USB Mounted");
}

void tud_umount_cb(void)
{
    ESP_LOGI(TAG, "USB Unmounted");
}

void tud_suspend_cb(bool remote_wakeup_en)
{
    ESP_LOGI(TAG, "USB Suspend");
}

void tud_resume_cb(void)
{
    ESP_LOGI(TAG, "USB Resume");
}

//
// Implement Bulk IN/OUT transfer abort and other auxiliary functions.
// Since we maintain an output buffer between SCPI and USB, so
// no additional operations are required.
//

bool tud_usbtmc_initiate_abort_bulk_in_cb(uint8_t* tmcResult)
{
    ESP_LOGD(TAG, "bulk in request is aborting");
    *tmcResult = USBTMC_STATUS_SUCCESS;
    return true;
}

bool tud_usbtmc_check_abort_bulk_in_cb(usbtmc_check_abort_bulk_rsp_t* rsp)
{
    ESP_LOGD(TAG, "bulk in request is aborted");
    tud_usbtmc_start_bus_read();
    return true;
}

bool tud_usbtmc_initiate_abort_bulk_out_cb(uint8_t* tmcResult)
{
    ESP_LOGD(TAG, "bulk out request is aborting");
    *tmcResult = USBTMC_STATUS_SUCCESS;
    return true;
}
bool tud_usbtmc_check_abort_bulk_out_cb(usbtmc_check_abort_bulk_rsp_t* rsp)
{
    ESP_LOGD(TAG, "bulk out request is aborted");
    tud_usbtmc_start_bus_read();
    return true;
}
void tud_usbtmc_bulkIn_clearFeature_cb(void)
{
}

void tud_usbtmc_bulkOut_clearFeature_cb(void)
{
    tud_usbtmc_start_bus_read();
}

//
// Implement device status clearing.
// SCPI layer clearing is not currently implemented.
//

bool tud_usbtmc_initiate_clear_cb(uint8_t* tmcResult)
{
    ESP_LOGD(TAG, "device status is clearing");
    *tmcResult = USBTMC_STATUS_SUCCESS;
    return true;
}

bool tud_usbtmc_check_clear_cb(usbtmc_get_clear_status_rsp_t* rsp)
{
    ESP_LOGD(TAG, "device status is cleared");
    rsp->USBTMC_status           = USBTMC_STATUS_SUCCESS;
    rsp->bmClear.BulkInFifoBytes = 0u;
    return true;
}

//
// Implement status byte reading, indicator light flashing, and triggers
//

uint8_t tud_usbtmc_get_stb_cb(uint8_t* tmcResult)
{
    return SCPI_RegGet(&scpi_context, SCPI_REG_STB); // Forward directly
}

bool tud_usbtmc_msg_trigger_cb(usbtmc_msg_generic_t* msg)
{
    (void)msg;
    SCPI_Control(&scpi_context, SCPI_CTRL_GET, 0);
    return true;
}

bool tud_usbtmc_indicator_pulse_cb(tusb_control_request_t const* msg, uint8_t* tmcResult)
{
    (void)msg; // To Be Done
    *tmcResult = USBTMC_STATUS_SUCCESS;
    return true;
}


//
// Implement data reception. Since the input buffer is managed by the SCPI Parser itself,
// simply pass the data in directly. Parsing begins after receiving a newline character.
//
bool tud_usbtmc_msg_data_cb(void* data, size_t len, bool transfer_complete)
{
    ESP_LOGD(TAG, "received %u bytes, transfer_complete=%d", (unsigned)len, transfer_complete);
    SCPI_Input(&scpi_context, data, len);
    tud_usbtmc_start_bus_read();
    return true;
}

//
// Implement data transfer request (the host requests the device to return data)
//
bool tud_usbtmc_msgBulkIn_request_cb(usbtmc_msg_request_dev_dep_in const* request)
{
    uint8_t stb = SCPI_RegGet(&scpi_context, SCPI_REG_STB);

    if (stb & STB_MAV) // Check if the output buffer which is managemented manually has valid data
    {
        return tud_usbtmc_transmit_dev_msg_data(
            message_out_buffer, message_out_buffer_ptr - message_out_buffer, true, false);
    }
    else
    {
        return false; // The TMC specification required to reply NAK
    }
}

//
// Implements SCPI callbacks
//

size_t SCPI_Write(scpi_t* context, const char* data, size_t len)
{
    (void)context;
    if (SCPI_RegGet(&scpi_context, SCPI_REG_STB) & STB_MAV)
    {
        return 0;
    }
    if ((len + (size_t)(message_out_buffer_ptr - message_out_buffer)) > MESSAGE_OUT_BUFFER_SIZE)
    {
        ESP_LOGE(TAG, "SCPI_Write is overflowing the buffer");
        return 0;
    }
    memcpy(message_out_buffer_ptr, data, len);
    message_out_buffer_ptr += len;
    return len;
}

scpi_result_t SCPI_Flush(scpi_t* context)
{
    (void)context;
    SCPI_RegSetBits(&scpi_context, SCPI_REG_STB, STB_MAV); // Fully copied, set MAV (Message Available)
    return SCPI_RES_OK;
}

int SCPI_Error(scpi_t* context, int_fast16_t err)
{
    (void)context;

    ESP_LOGE(TAG, "**ERROR: %d, \"%s\"", (int16_t)err, SCPI_ErrorTranslate(err));
    return 0;
}

scpi_result_t SCPI_Control(scpi_t* context, scpi_ctrl_name_t ctrl, scpi_reg_val_t val)
{
    (void)context;

    if (SCPI_CTRL_SRQ == ctrl)
    {
        ESP_LOGI(TAG, "**SRQ: 0x%X (%d)", val, val);
    }
    else if (ctrl == SCPI_CTRL_LLO  ctrl == SCPI_CTRL_SDC)
    {
        ESP_LOGI(TAG, "device cleared");
    }
    else
    {
        ESP_LOGI(TAG, "**CTRL %02x: 0x%X (%d)", ctrl, val, val);
    }
    return SCPI_RES_OK;
}

scpi_result_t SCPI_Reset(scpi_t* context)
{
    (void)context;

    ESP_LOGI(TAG, "**Reset");
    return SCPI_RES_OK;
}
```

Finally, implement your SCPI subroutine according to the scpi-parser common\_c example to implement the entire SCPI command set. Additionally, you can use SCPI\_ErrorPushEx to send an error to the SCPI subsystem when a device error occurs. The entire initialization implementation is as follows: (This private header file, #include <esp\_private/usb\_phy.h> is required)

```c
    usb_phy_handle_t phy_handle;

    usb_phy_config_t phy_conf = {
        .controller = USB_PHY_CTRL_OTG,
        .otg_mode   = USB_OTG_MODE_DEVICE,
        .target     = USB_PHY_TARGET_INT,
    };
    ESP_ERROR_CHECK(usb_new_phy(&phy_conf, &phy_handle));

    tusb_rhport_init_t dev_init = { .role = TUSB_ROLE_DEVICE, .speed = TUSB_SPEED_AUTO };
    tusb_init(0, &dev_init);

    SCPI_Init(
        &scpi_context,
        scpi_commands,
        &scpi_interface,
        scpi_units_def,
        SYSTEM_MANUFACTURE,
        SYSTEM_NAME,
        SYSTEM_SERIAL,
        SYSTEM_VERSION,
        message_in_buffer,
        MESSAGE_IN_BUFFER_SIZE,
        scpi_error_queue_data,
        ERROR_QUEUE_SIZE);
    scpi_context.user_context = pvParameter; // actually the queue handler
    while (1)
    {
        // Polling your message queue here and deal with any exceptions.
        tud_task(); // Caution: an blocked function!
    }
```

At this point, the USB488 has been implemented. Open the device manager and you will see an IVI device (you need to install the VISA driver first, such as Keysight IO Suite and NI-VISA). Open NI-MAX and query \*IDN?. The result is as follows:

![](https://alancui.cc/wp-content/uploads/2025/09/usb4882_on_esp32_hardware_manager.png)

![](https://alancui.cc/wp-content/uploads/2025/09/usb4882_on_esp32_idn_query.png)

The USB TMC specification for reference purpose：

[USBTMC\_1\_006a](https://alancui.cc/wp-content/uploads/2025/09/USBTMC_1_006a.zip)[下载](https://alancui.cc/wp-content/uploads/2025/09/USBTMC_1_006a.zip)

Alan. 2025/09/25
