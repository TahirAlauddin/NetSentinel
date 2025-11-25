import { DepartmentRecord } from "../departments";
import { ComputerDetails, NetworkDetails, DisplayDetails, PhoneDetails, PeripheralDetails } from "./extensions";
import { Category, Vendor, Tag, AssetStatus, AssetImage, AssetAttachment, CalendarAlert } from "./fields";
import { LocationRecord } from "../locations";
import { UserRecord as User } from "../users";
import { CustomLifecycle } from "./fields";

type NullableString = string | null;
type NullableNumber = number | null;
type NullableDateString = string | null;

export interface Asset {
    id: number,
    name: string,
    category: Category
    asset_tag: NullableString,
    impact: NullableNumber,
    vendor: Vendor | null,
    notes: NullableString,

    model: NullableString,
    serial_number: NullableString,
    status: AssetStatus,
   
    purchase_date: NullableDateString,
    assigned_to: User,

    location: LocationRecord,
    mac_address: NullableString,
    ip_address: NullableString,
    
    manufacturer: NullableString,
    tags: Tag[],
    system_uuid: NullableString,
    system_uptime: NullableString,
    in_current_state_since: NullableDateString,
    expected_checkin_date: NullableDateString,
    used_by: User,
    managed_by: User,
    
    departments: DepartmentRecord[],
    custom_lifecycle: CustomLifecycle,

    purchase_price: NullableString,
    replacement_cost: NullableString,
    salvage_value: NullableString,

    useful_life_years: NullableNumber,
    approaching_eol_months: NullableNumber,
    po_number: NullableString,

    machine_serial_number: NullableString,
    product_number: NullableString,
    
    acquisition_date: NullableDateString,
    warranty_expiration: NullableDateString,
    installation_date: NullableDateString,

    calendar_alerts: CalendarAlert[],
    
    images: AssetImage[],
    attachments: AssetAttachment[],

    created_at: string,
    updated_at: string,

    computer_details: ComputerDetails,
    network_details: NetworkDetails,
    display_details: DisplayDetails,
    phone_details: PhoneDetails,
    peripheral_details: PeripheralDetails
}