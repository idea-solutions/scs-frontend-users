import { PlusOutlined } from "@ant-design/icons";
import { Modal, Upload } from "antd";
import axios from "axios";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiUrl } from "../../../../constants";
import { AuthContext } from "../../../../contexts/AuthContext";
import { convertFormData } from "../../../../utils/form-data";
import Loading from "../../../layouts/Loading";
import "../../User/assets/css/profile.css";

const loadPageHome = () => {
    window.location.href = window.location.href.replace(window.location.href.split("/")[3], "");
};

const getBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });

const CreateConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [listWarehouse, setListWarehouse] = useState();
    const [listMaterial, setListMaterial] = useState();

    //============== UPLOAD FILE ==================
    const [fileList, setFileList] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    const handleCancel = () => setPreviewOpen(false);

    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }
        setPreviewImage(file.url || file.preview);
        setPreviewOpen(true);
        //  setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf("/") + 1));
    };

    const handleChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const uploadButton = (
        <div>
            <PlusOutlined />
            <div
                style={{
                    marginTop: 8,
                }}
            >
                Thêm Ảnh
            </div>
        </div>
    );

    const handleRemove = async (_file) => {
        console.log(_file);

        const isConfirmDelete = await new Promise((resolve, _reject) => {
            Swal.fire({
                title: "Xóa minh chứng?",
                text: "Bạn có chắc xóa minh chứng này?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Xóa",
                cancelButtonText: "Hủy",
            }).then((result) => {
                if (result.isConfirmed) {
                    resolve(true);
                }
            });
        });

        return isConfirmDelete ? true : false;
    };

    // End Upload Img

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                Array.from(document.getElementsByClassName("ant-tooltip")).forEach((item) => {
                    //console.log(item);
                    item.removeChild(item.firstElementChild);
                });
            } catch (error) {}
            Array.from(document.getElementsByClassName("ant-upload-list-item")).forEach((item) => {
                item.style = "border-color:#18d2d7";
            });
        }, 10);
        return () => clearInterval(interval);
    }, []);

    //==========================================

    const [inputDataForm, setInputDataForm] = useState([]);

    const {
        authState: { user, authLoading, isAuthenticated, isReceiveMaterial },

        loadUser,
    } = useContext(AuthContext);

    if (!authLoading && !isAuthenticated) {
        navigate(`/login?redirectTo=${location.pathname}${location.search}`);
    }

    if (isReceiveMaterial) {
        Swal.fire({
            position: "top-center",
            icon: "warning",
            title: "Thông Báo!\n\nBạn đã gửi yêu cầu nhận nguyên liệu trước đó!",
            html: `<div>
                        Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
                        <br />
                        <hr />
                        Hoặc bạn có thể liên hệ qua:
                        <div
                            style="display: flex;
                                justify-content: center;
                                padding: 5px 100px;
                                flex-direction: column;
                                align-items: flex-start;"
                        >
                            <p>
                                <i class="bi bi-dot"></i> <i class="bi bi-facebook"></i> Facebook:
                                <a
                                    style="color: blue; font-style: italic;font-weight: bold;"
                                    href="https://www.facebook.com/CrisAn.2001"
                                    target="_blank"
                                >
                                    SCS - HELPZ
                                </a>
                            </p>
                            <p>
                                <i class="bi bi-dot"></i> <i class="bi bi-telephone-inbound-fill"></i> Phone:
                                <a
                                    href="tel:0335183057"
                                    style="color: blue; font-style: italic;font-weight: bold;"
                                >
                                    0335.183.057
                                </a>
                            </p>
                        </div>
                    </div>`,
            showConfirmButton: true,
            timer: 10000,
        }).finally(() => {
            loadPageHome();
        });
        setTimeout(() => loadPageHome(), 5000);
    }

    const [disableButtonConfirmation, setDisableButtonConfirmation] = useState(true);

    const [createConfirmationForm, setCreateConfirmationForm] = useState({
        description: "",
        userId: user?.data?.id,
        warehouseId: null,
    });

    const getWarehouse = async () => {
        const resWarehouse = await axios.post(`${apiUrl}/warehouses/search`);
        if (resWarehouse?.data?.data?.items?.length) {
            setListWarehouse(resWarehouse?.data?.data?.items);
        }
    };

    if (!listWarehouse) {
        getWarehouse();
    }

    const getDetailWarehouse = async (id) => {
        if (id) {
            const resDetailWarehouse = await axios.post(`${apiUrl}/warehouses/${id}`, {
                include: {
                    warehouseMaterials: {
                        include: { material: { select: { name: true, unit: true } } },
                    },
                },
            });
            if (resDetailWarehouse?.data?.data) {
                setInputDataForm([]);
                setListMaterial(resDetailWarehouse?.data?.data);
                setCreateConfirmationForm({ ...createConfirmationForm, warehouseId: id });
            }
        }
    };

    const checkData = () => {
        const isEmptyQuantity = inputDataForm.filter((p) => p.quantity > 0);

        convertFormData({
            ...createConfirmationForm,
            confirmationDetails: {
                create: inputDataForm.filter((p) => p.quantity > 0),
            },
            images: fileList,
        });

        if (
            !isEmptyQuantity.length ||
            !createConfirmationForm.userId ||
            !createConfirmationForm.warehouseId ||
            createConfirmationForm.description.length <= 5 ||
            fileList?.length <= 0
        ) {
            setDisableButtonConfirmation(true);
        } else {
            setDisableButtonConfirmation(false);
        }
    };

    useEffect(() => {
        checkData();
    }, [createConfirmationForm, fileList]);

    const onChangeGetDetailWarehouse = (event) => {
        if (event.target.value === "") {
            setListMaterial("");
            setInputDataForm([]);
            setDisableButtonConfirmation(true);
        } else {
            getDetailWarehouse(event.target.value);
        }
    };

    useEffect(() => {
        listMaterial?.warehouseMaterials?.map((item) => {
            inputDataForm.push({
                material: {
                    connect: {
                        id: item.materialId,
                    },
                },
                quantity: 0,
            });
        });
        console.log(inputDataForm);
    }, [listMaterial]);

    const onChangeSetQuantity = (event) => {
        event.target.value = event.target.value.replace(/\D/g, "");

        const quantity = +listMaterial.warehouseMaterials.find(
            (p) => p.materialId == event.target.name,
        ).quantity;

        console.log(inputDataForm.find((p) => p.material.connect.id == event.target.name));

        if (event.target.value > quantity) {
            inputDataForm.find((p) => p.material.connect.id == event.target.name)["quantity"] =
                quantity;
            event.target.value = quantity;
        } else {
            inputDataForm.find((p) => p.material.connect.id == event.target.name)["quantity"] =
                +event.target.value;
        }
        checkData();
        console.log(inputDataForm);
    };
    const { description } = createConfirmationForm;
    const clearData = useCallback(() => {
        setCreateConfirmationForm({
            userId: user?.data?.id || null,
            description: createConfirmationForm.description || "",
            warehouseId: listMaterial?.id,
        });
    }, [user?.data?.id]);

    useEffect(() => {
        clearData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadUser]);

    const onChangeCreateConfirmationForm = useCallback(
        (event) => {
            setCreateConfirmationForm({
                ...createConfirmationForm,
                [event.target.name]: event.target.value,
            });
        },
        [createConfirmationForm],
    );
    const [isLoading, setIsLoading] = useState();

    const onSubmit = useCallback(
        async (event) => {
            event.preventDefault();

            if (!user?.data?.id) {
                Swal.fire({
                    position: "top-center",
                    icon: "warning",
                    title: "Warning",
                    text: "Vui lòng đăng nhập và thử lại!",
                    showConfirmButton: true,
                    timer: 5000,
                });

                return;
            }
            setIsLoading(true);

            try {
                const res = await axios.post(
                    apiUrl + "/confirmations",
                    convertFormData({
                        ...createConfirmationForm,
                        confirmationDetails: {
                            create: inputDataForm.filter((p) => p.quantity > 0),
                        },
                        images: fileList,
                    }),
                );
                console.log(res);

                if (res?.data) {
                    setIsLoading(false);
                    Swal.fire({
                        position: "top-center",
                        icon: "success",
                        title: "Đã gửi yêu cầu nhận nguyên liệu thành công!",
                        html: `<div>
                                    Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
                                    <br />
                                    <hr />
                                    Hoặc bạn có thể liên hệ qua:
                                    <div
                                        style="display: flex;
                                            justify-content: center;
                                            padding: 5px 100px;
                                            flex-direction: column;
                                            align-items: flex-start;"
                                    >
                                        <p>
                                            <i class="bi bi-dot"></i> <i class="bi bi-facebook"></i> Facebook:
                                            <a
                                                style="color: blue; font-style: italic;font-weight: bold;"
                                                href="https://www.facebook.com/CrisAn.2001"
                                                target="_blank"
                                            >
                                                SCS - HELPZ
                                            </a>
                                        </p>
                                        <p>
                                            <i class="bi bi-dot"></i> <i class="bi bi-telephone-inbound-fill"></i> Phone:
                                            <a
                                                href="tel:0335183057"
                                                style="color: blue; font-style: italic;font-weight: bold;"
                                            >
                                                0335.183.057
                                            </a>
                                        </p>
                                    </div>
                                </div>`,
                        showConfirmButton: true,
                        timer: 10000,
                    }).then((result) => {
                        if (result.isConfirmed) {
                            loadPageHome();
                        }
                    });
                    setTimeout(() => loadPageHome(), 5000);

                    return;
                }
            } catch (error) {
                setIsLoading(false);
                Swal.fire({
                    position: "top-center",
                    icon: "error",
                    title: "error",
                    text: "Có lỗi xảy ra, vui lòng thử lại sau!",
                    showConfirmButton: true,
                    timer: 5000,
                });

                return;
            }
        },
        [
            createConfirmationForm,
            description,
            createConfirmationForm.userId,
            createConfirmationForm.warehouseId,
        ],
    );

    return (
        <>
            <Loading hidden={!isLoading} />
            <div
                style={{
                    background:
                        "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(../img/page-header.jpg)",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "cover",
                    paddingBottom: "40px",
                }}
                className="profile"
            >
                <div className="page-header" style={{ padding: "65px", background: "unset" }}>
                    <div className="container">
                        <div className="row"></div>
                    </div>
                </div>
                <div
                    className="container rounded bg-white mt-5 mb-5"
                    style={{
                        fontFamily: `'Muli',sans-serif,"Comic Sans MS", "Poppins-Regular", "Arial", "Times"`,
                    }}
                >
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <div className="row">
                            <div className="col-md-12 ">
                                <div style={{ padding: "50px 150px" }}>
                                    <div className="d-flex justify-content-center align-items-center mb-3">
                                        <h4 className="text-right" style={{ fontWeight: 550 }}>
                                            Thông Tin Nhận Nguyên Liệu
                                        </h4>
                                    </div>
                                    <div className="row mt-3">
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <div className="row" style={{ minWidth: "600px" }}>
                                                <div className="col-2">
                                                    <label className="label-info-user">
                                                        Họ Tên:
                                                    </label>

                                                    <label className="label-info-user">SĐT:</label>

                                                    <label className="label-info-user">
                                                        Địa Chỉ:
                                                    </label>

                                                    <label className="label-info-user">
                                                        Email:
                                                    </label>
                                                </div>
                                                <div className="col-10">
                                                    <label className="info-user-charity-call">
                                                        {user?.data?.fullName}
                                                    </label>
                                                    <label className="info-user-charity-call">
                                                        {user?.data?.phone}
                                                    </label>

                                                    <label className="info-user-charity-call">
                                                        {user?.data?.address}
                                                    </label>

                                                    <label className="info-user-charity-call">
                                                        {user?.data?.email}
                                                    </label>
                                                </div>
                                            </div>
                                            <hr />
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <strong style={{ color: "red", fontSize: 15 }}>
                                                Bạn Muốn Nhận Nguyên Liệu Kho Nào?
                                            </strong>
                                            <select
                                                onChange={onChangeGetDetailWarehouse}
                                                style={{
                                                    borderRadius: 5,
                                                    padding: 3,
                                                    marginLeft: 10,
                                                }}
                                            >
                                                <option value={""} selected>
                                                    -----
                                                </option>
                                                {listWarehouse?.length &&
                                                    listWarehouse.map((item) => {
                                                        return (
                                                            <option value={item.id}>
                                                                {item.name} ({item.address})
                                                            </option>
                                                        );
                                                    })}
                                            </select>
                                            <br />
                                            <div
                                                className="row"
                                                style={{ maxHeight: 300, overflowY: "scroll" }}
                                            >
                                                {listMaterial?.warehouseMaterials?.length ? (
                                                    listMaterial?.warehouseMaterials.map((item) => {
                                                        return (
                                                            <div className="col-4">
                                                                <br />
                                                                <div>
                                                                    <span>
                                                                        {item.material.name}:
                                                                        &ensp;&ensp;
                                                                    </span>
                                                                    <input
                                                                        placeholder="0"
                                                                        name={item.materialId}
                                                                        type="text"
                                                                        style={{
                                                                            textAlign: "right",
                                                                            width: "100px",
                                                                        }}
                                                                        onChange={(e) =>
                                                                            onChangeSetQuantity(e)
                                                                        }
                                                                    />{" "}
                                                                    {item.material.unit} <br />
                                                                    <div
                                                                        style={{
                                                                            fontStyle: "italic",
                                                                            fontSize: 15,
                                                                        }}
                                                                    >
                                                                        Hiện có:{" "}
                                                                        {item.quantity +
                                                                            " " +
                                                                            item.material.unit}
                                                                    </div>
                                                                </div>
                                                                <br />
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div
                                                        style={{
                                                            textAlign: "center",
                                                            width: "100%",
                                                            marginTop: "20px",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        Kho này hiện không có nguyên liệu nào
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">
                                                <strong style={{ color: "red", fontSize: 15 }}>
                                                    Hình ảnh người nhận nguyên liệu
                                                </strong>
                                                <br></br>
                                                <p className="attention">
                                                    Vui lòng thêm ảnh người nhận nguyên liệu để xác
                                                    minh
                                                </p>
                                            </label>
                                            <>
                                                <Upload
                                                    action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                                                    listType="picture-card"
                                                    fileList={fileList}
                                                    onPreview={handlePreview}
                                                    onChange={handleChange}
                                                    onRemove={handleRemove}
                                                    multiple={true}
                                                    maxCount={5}
                                                    accept="image/png, image/jpeg, image/jpg"
                                                >
                                                    {fileList.length >= 5 ? null : uploadButton}
                                                </Upload>
                                                <Modal
                                                    open={previewOpen}
                                                    footer={null}
                                                    onCancel={handleCancel}
                                                >
                                                    <img
                                                        alt="example"
                                                        style={{
                                                            width: "100%",
                                                        }}
                                                        src={previewImage}
                                                    />
                                                </Modal>
                                            </>
                                        </div>
                                        <div className="col-md-12" style={{ marginTop: 15 }}>
                                            <label className="labels">
                                                <strong style={{ color: "red", fontSize: 15 }}>
                                                    Mô tả
                                                </strong>
                                                <br></br>
                                                <p className="attention">
                                                    Hãy để lại một vài dòng nêu rõ lý do bạn muốn
                                                    nhận nguyên liệu nhé!
                                                </p>
                                            </label>

                                            <textarea
                                                style={{
                                                    textAlign: "left",
                                                    height: 75,
                                                    maxHeight: 200,
                                                    minHeight: 75,
                                                }}
                                                type="text"
                                                className="form-control"
                                                name="description"
                                                value={description}
                                                onChange={onChangeCreateConfirmationForm}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 text-center">
                                        <button
                                            onClick={onSubmit}
                                            className="btn btn-primary profile-button"
                                            type="button"
                                            disabled={disableButtonConfirmation}
                                        >
                                            Gửi Yêu Cầu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateConfirmation;
